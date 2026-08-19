param(
  [Parameter(Mandatory = $true)]
  [string]$DirectoryPath
)

$ErrorActionPreference = "Stop"

Add-Type -TypeDefinition @"
using System;
using System.ComponentModel;
using System.IO;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Threading;
using System.Text;
using Microsoft.Win32.SafeHandles;

public static class Write1vPublication
{
    private const uint FILE_READ_ATTRIBUTES = 0x0080;
    private const uint FILE_TRAVERSE = 0x0020;
    private const uint DELETE = 0x00010000;
    private const uint GENERIC_READ = 0x80000000;
    private const uint FILE_SHARE_READ = 0x00000001;
    private const uint FILE_SHARE_WRITE = 0x00000002;
    private const uint FILE_SHARE_DELETE = 0x00000004;
    private const uint OPEN_EXISTING = 3;
    private const uint FILE_FLAG_BACKUP_SEMANTICS = 0x02000000;
    private const uint FILE_FLAG_OPEN_REPARSE_POINT = 0x00200000;
    private const uint FILE_ATTRIBUTE_REPARSE_POINT = 0x00000400;
    private const int FileIdInfo = 18;
    private const int FileRenameInformationEx = 65;
    private const uint FILE_RENAME_REPLACE_IF_EXISTS = 0x00000001;
    private const uint FILE_RENAME_POSIX_SEMANTICS = 0x00000002;

    [StructLayout(LayoutKind.Sequential)]
    private struct FILE_ID_128
    {
        [MarshalAs(UnmanagedType.ByValArray, SizeConst = 16)]
        public byte[] Identifier;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct FILE_ID_INFO
    {
        public ulong VolumeSerialNumber;
        public FILE_ID_128 FileId;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct BY_HANDLE_FILE_INFORMATION
    {
        public uint FileAttributes;
        public System.Runtime.InteropServices.ComTypes.FILETIME CreationTime;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastAccessTime;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWriteTime;
        public uint VolumeSerialNumber;
        public uint FileSizeHigh;
        public uint FileSizeLow;
        public uint NumberOfLinks;
        public uint FileIndexHigh;
        public uint FileIndexLow;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct IO_STATUS_BLOCK
    {
        public IntPtr Status;
        public UIntPtr Information;
    }

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern SafeFileHandle CreateFileW(
        string fileName,
        uint desiredAccess,
        uint shareMode,
        IntPtr securityAttributes,
        uint creationDisposition,
        uint flagsAndAttributes,
        IntPtr templateFile);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool GetFileInformationByHandleEx(
        SafeFileHandle file,
        int informationClass,
        out FILE_ID_INFO information,
        uint bufferSize);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool GetFileInformationByHandle(
        SafeFileHandle file,
        out BY_HANDLE_FILE_INFORMATION information);

    [DllImport("ntdll.dll")]
    private static extern int NtSetInformationFile(
        SafeFileHandle file,
        out IO_STATUS_BLOCK ioStatusBlock,
        IntPtr information,
        uint bufferSize,
        int informationClass);

    public sealed class PublicationResult
    {
        public string Status { get; set; }
        public string Detail { get; set; }
        public string OriginalTargetIdentity { get; set; }
        public string PreparedTempIdentity { get; set; }
        public string ResultIdentity { get; set; }
        public string ObservedTargetHash { get; set; }
        public string ResultHash { get; set; }
    }

    public sealed class PreparedRename : IDisposable
    {
        internal SafeFileHandle SourceHandle;
        public PublicationResult Result { get; private set; }

        internal PreparedRename(SafeFileHandle sourceHandle, PublicationResult result)
        {
            SourceHandle = sourceHandle;
            Result = result;
        }

        public void Dispose()
        {
            if (SourceHandle != null) SourceHandle.Dispose();
        }
    }

    public sealed class HeldDirectory : IDisposable
    {
        public string Path { get; private set; }
        public string Identity { get; private set; }
        internal SafeFileHandle Handle;

        internal HeldDirectory(string path, SafeFileHandle handle, string identity)
        {
            Path = path;
            Handle = handle;
            Identity = identity;
        }

        public void Dispose()
        {
            if (Handle != null) Handle.Dispose();
        }
    }

    private static SafeFileHandle OpenPath(string path, uint access, uint share, uint flags)
    {
        SafeFileHandle handle = CreateFileW(
            path,
            access,
            share,
            IntPtr.Zero,
            OPEN_EXISTING,
            flags,
            IntPtr.Zero);
        if (handle.IsInvalid)
        {
            int error = Marshal.GetLastWin32Error();
            handle.Dispose();
            throw new Win32Exception(error, "Cannot acquire directory identity guard: " + path);
        }
        return handle;
    }

    private static SafeFileHandle OpenDirectory(string path)
    {
        return OpenPath(path, FILE_TRAVERSE | FILE_READ_ATTRIBUTES, FILE_SHARE_READ | FILE_SHARE_WRITE, FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAG_OPEN_REPARSE_POINT);
    }

    private static SafeFileHandle OpenReadFile(string path)
    {
        return OpenPath(path, GENERIC_READ | FILE_READ_ATTRIBUTES, FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE, FILE_FLAG_OPEN_REPARSE_POINT);
    }

    private static SafeFileHandle OpenRenameSource(string path)
    {
        return OpenPath(path, GENERIC_READ | FILE_READ_ATTRIBUTES | DELETE, FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE, FILE_FLAG_OPEN_REPARSE_POINT);
    }

    private static string ReadIdentity(SafeFileHandle handle, string path)
    {
        BY_HANDLE_FILE_INFORMATION basic;
        if (!GetFileInformationByHandle(handle, out basic))
            throw new Win32Exception(Marshal.GetLastWin32Error(), "Cannot inspect directory attributes: " + path);
        if ((basic.FileAttributes & FILE_ATTRIBUTE_REPARSE_POINT) != 0)
            throw new InvalidOperationException("Reparse-bearing canonical ancestor is not accepted: " + path);

        FILE_ID_INFO id;
        uint size = (uint)Marshal.SizeOf(typeof(FILE_ID_INFO));
        if (!GetFileInformationByHandleEx(handle, FileIdInfo, out id, size))
            throw new Win32Exception(Marshal.GetLastWin32Error(), "Cannot obtain stable directory file ID: " + path);
        return id.VolumeSerialNumber.ToString("X16") + ":" + BitConverter.ToString(id.FileId.Identifier).Replace("-", "");
    }

    private static string Hash(SafeFileHandle handle)
    {
        using (SafeFileHandle borrowed = new SafeFileHandle(handle.DangerousGetHandle(), false))
        using (FileStream stream = new FileStream(borrowed, FileAccess.Read, 65536, false))
        using (SHA256 algorithm = SHA256.Create())
        {
            stream.Position = 0;
            return BitConverter.ToString(algorithm.ComputeHash(stream)).Replace("-", "").ToLowerInvariant();
        }
    }

    public static HeldDirectory Hold(string path)
    {
        SafeFileHandle handle = OpenDirectory(path);
        try
        {
            return new HeldDirectory(path, handle, ReadIdentity(handle, path));
        }
        catch
        {
            handle.Dispose();
            throw;
        }
    }

    public static string Snapshot(string path)
    {
        using (SafeFileHandle handle = OpenDirectory(path))
            return ReadIdentity(handle, path);
    }

    public static PreparedRename Prepare(string target, string replacement, string expectedTargetHash, string expectedResultHash)
    {
        PublicationResult result = new PublicationResult();
        SafeFileHandle sourceHandle = null;
        try
        {
            sourceHandle = OpenRenameSource(replacement);
            using (SafeFileHandle targetHandle = OpenReadFile(target))
            {
                result.OriginalTargetIdentity = ReadIdentity(targetHandle, target);
                result.PreparedTempIdentity = ReadIdentity(sourceHandle, replacement);
                result.ObservedTargetHash = Hash(targetHandle);
                string tempHash = Hash(sourceHandle);
                if (!String.Equals(result.ObservedTargetHash, expectedTargetHash, StringComparison.OrdinalIgnoreCase))
                {
                    result.Status = "CONFLICT";
                    result.Detail = "Canonical bytes changed before handle-relative publication";
                    sourceHandle.Dispose();
                    return new PreparedRename(null, result);
                }
                if (!String.Equals(tempHash, expectedResultHash, StringComparison.OrdinalIgnoreCase))
                {
                    result.Status = "PUBLISH_FAILED";
                    result.Detail = "Prepared source-handle hash changed before publication";
                    sourceHandle.Dispose();
                    return new PreparedRename(null, result);
                }
            }
            result.Status = "RENAME_READY";
            result.Detail = "Source and target handles verified; source handle remains open for relative rename";
            return new PreparedRename(sourceHandle, result);
        }
        catch (Exception error)
        {
            if (sourceHandle != null) sourceHandle.Dispose();
            result.Status = "PUBLISH_FAILED";
            result.Detail = error.Message;
            return new PreparedRename(null, result);
        }
    }

    public static PublicationResult Commit(PreparedRename prepared, HeldDirectory trustedParent, string targetName, string expectedResultHash)
    {
        PublicationResult result = prepared.Result;
        bool attempted = false;
        IntPtr buffer = IntPtr.Zero;
        try
        {
            if (prepared.SourceHandle == null || prepared.SourceHandle.IsInvalid)
                throw new InvalidOperationException("No prepared source handle is available");
            if (String.IsNullOrWhiteSpace(targetName) || targetName.IndexOfAny(new char[] { '\\', '/' }) >= 0)
                throw new InvalidOperationException("Handle-relative destination must be a simple filename");

            byte[] name = Encoding.Unicode.GetBytes(targetName);
            int pointerOffset = IntPtr.Size == 8 ? 8 : 4;
            int lengthOffset = IntPtr.Size == 8 ? 16 : 8;
            int nameOffset = IntPtr.Size == 8 ? 20 : 12;
            int headerSize = IntPtr.Size == 8 ? 24 : 16;
            int bufferSize = headerSize + name.Length;
            buffer = Marshal.AllocHGlobal(bufferSize);
            for (int index = 0; index < bufferSize; index++) Marshal.WriteByte(buffer, index, 0);
            Marshal.WriteInt32(buffer, 0, unchecked((int)(FILE_RENAME_REPLACE_IF_EXISTS | FILE_RENAME_POSIX_SEMANTICS)));
            Marshal.WriteIntPtr(buffer, pointerOffset, trustedParent.Handle.DangerousGetHandle());
            Marshal.WriteInt32(buffer, lengthOffset, name.Length);
            Marshal.Copy(name, 0, IntPtr.Add(buffer, nameOffset), name.Length);

            attempted = true;
            for (int attempt = 0; ; attempt++)
            {
                IO_STATUS_BLOCK ioStatus;
                int status = NtSetInformationFile(prepared.SourceHandle, out ioStatus, buffer, (uint)bufferSize, FileRenameInformationEx);
                if (status == 0) break;
                uint unsignedStatus = unchecked((uint)status);
                bool contention = unsignedStatus == 0xC0000043 || unsignedStatus == 0xC0000022 || unsignedStatus == 0xC0000056;
                if (!contention || attempt >= 49)
                {
                    result.Status = "PUBLISH_FAILED";
                    string mapped = unsignedStatus == 0xC0000043 ? "Win32 error 32 / sharing violation; " :
                                    unsignedStatus == 0xC0000022 ? "Win32 error 5 / access denied; " :
                                    unsignedStatus == 0xC0000056 ? "delete pending; " : "";
                    result.Detail = mapped + "NtSetInformationFile(FileRenameInformationEx) failed with NTSTATUS 0x" + unsignedStatus.ToString("X8");
                    return result;
                }
                Thread.Sleep(5);
            }

            result.ResultIdentity = ReadIdentity(prepared.SourceHandle, targetName);
            result.ResultHash = Hash(prepared.SourceHandle);
            if (!String.Equals(result.ResultIdentity, result.PreparedTempIdentity, StringComparison.Ordinal) ||
                !String.Equals(result.ResultHash, expectedResultHash, StringComparison.OrdinalIgnoreCase))
            {
                result.Status = "RECOVERY_REQUIRED";
                result.Detail = "Post-publication source-handle identity/hash mismatch";
                return result;
            }
            result.Status = "PUBLISHED";
            result.Detail = "NtSetInformationFile(FileRenameInformationEx) published the verified source handle relative to the trusted parent handle";
            return result;
        }
        catch (Exception error)
        {
            result.Status = attempted ? "RECOVERY_REQUIRED" : "PUBLISH_FAILED";
            result.Detail = error.Message;
            return result;
        }
        finally
        {
            if (buffer != IntPtr.Zero) Marshal.FreeHGlobal(buffer);
            prepared.Dispose();
        }
    }
}
"@

function Get-DirectoryChain([string]$Path) {
  $full = [IO.Path]::GetFullPath($Path).TrimEnd('\')
  $root = [IO.Path]::GetPathRoot($full).TrimEnd('\') + '\'
  $result = [Collections.Generic.List[string]]::new()
  $result.Add($root)
  $relative = $full.Substring($root.Length)
  $current = $root
  foreach ($component in $relative.Split([char[]]'\', [StringSplitOptions]::RemoveEmptyEntries)) {
    $current = [IO.Path]::Combine($current, $component)
    $result.Add($current)
  }
  return $result
}

$held = [Collections.Generic.List[IDisposable]]::new()
$identities = [ordered]@{}
$trustedParent = $null
$prepared = $null
try {
  foreach ($directory in (Get-DirectoryChain $DirectoryPath)) {
    $guard = [Write1vPublication]::Hold($directory)
    $held.Add($guard)
    $identities[$directory] = $guard.Identity
    $trustedParent = $guard
  }
  [Console]::Out.WriteLine((@{ status = "READY"; identities = $identities } | ConvertTo-Json -Compress -Depth 5))
  [Console]::Out.Flush()

  while ($true) {
    $command = [Console]::In.ReadLine()
    if ($null -eq $command -or $command -eq "CLOSE") { break }
    $message = if ($command.StartsWith('{')) { $command | ConvertFrom-Json } else { [pscustomobject]@{ command = $command } }
    if ($message.command -eq "VERIFY") {
      foreach ($directory in $identities.Keys) {
        $observed = [Write1vPublication]::Snapshot($directory)
        if ($observed -ne $identities[$directory]) {
          throw "Canonical directory identity discontinuity: $directory expected=$($identities[$directory]) observed=$observed"
        }
      }
      [Console]::Out.WriteLine((@{ status = "VERIFIED"; identities = $identities } | ConvertTo-Json -Compress -Depth 5))
      [Console]::Out.Flush()
      continue
    }
    if ($message.command -ne "PUBLISH") { throw "Unsupported guard command: $($message.command)" }
    $prepared = [Write1vPublication]::Prepare($message.target, $message.replacement, $message.expectedTargetHash, $message.expectedResultHash)
    $publication = $prepared.Result
    [Console]::Out.WriteLine((@{
      status = $publication.Status
      detail = $publication.Detail
      originalTargetIdentity = $publication.OriginalTargetIdentity
      preparedTempIdentity = $publication.PreparedTempIdentity
      resultIdentity = $publication.ResultIdentity
      observedTargetHash = $publication.ObservedTargetHash
      resultHash = $publication.ResultHash
    } | ConvertTo-Json -Compress))
    [Console]::Out.Flush()
    if ($publication.Status -ne "RENAME_READY") {
      $prepared.Dispose()
      $prepared = $null
      continue
    }
    $decision = [Console]::In.ReadLine()
    if ($decision -ne "COMMIT") { throw "Unsupported prepared-rename decision: $decision" }
    $publication = [Write1vPublication]::Commit($prepared, $trustedParent, [IO.Path]::GetFileName($message.target), $message.expectedResultHash)
    $prepared = $null
    [Console]::Out.WriteLine((@{
      status = $publication.Status
      detail = $publication.Detail
      originalTargetIdentity = $publication.OriginalTargetIdentity
      preparedTempIdentity = $publication.PreparedTempIdentity
      resultIdentity = $publication.ResultIdentity
      observedTargetHash = $publication.ObservedTargetHash
      resultHash = $publication.ResultHash
    } | ConvertTo-Json -Compress))
    [Console]::Out.Flush()
  }
} catch {
  [Console]::Out.WriteLine((@{ status = "ERROR"; detail = $_.Exception.Message } | ConvertTo-Json -Compress))
  [Console]::Out.Flush()
  exit 2
} finally {
  if ($null -ne $prepared) { $prepared.Dispose() }
  for ($index = $held.Count - 1; $index -ge 0; $index--) { $held[$index].Dispose() }
}
