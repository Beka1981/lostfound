using LostFound.Application.Abstractions;

namespace LostFound.Infrastructure.Storage;
public sealed class LocalFileStorageService(string contentRoot) : IFileStorageService
{
 private static readonly HashSet<string> Allowed = ["image/jpeg","image/png","image/webp"];
 public async Task<string> SaveImageAsync(Stream content,string contentType,CancellationToken ct) { if(!Allowed.Contains(contentType)) throw new InvalidOperationException("Unsupported image type.");await using var validated=new MemoryStream();await content.CopyToAsync(validated,ct);var bytes=validated.GetBuffer().AsSpan(0,(int)validated.Length);var valid=contentType switch{"image/png"=>bytes.Length>=8&&bytes[..8].SequenceEqual(new byte[]{137,80,78,71,13,10,26,10}),"image/webp"=>bytes.Length>=12&&bytes[..4].SequenceEqual("RIFF"u8)&&bytes.Slice(8,4).SequenceEqual("WEBP"u8),_=>bytes.Length>=3&&bytes[0]==0xFF&&bytes[1]==0xD8&&bytes[2]==0xFF};if(!valid)throw new InvalidOperationException("Image content does not match its declared type.");var ext=contentType switch{"image/png"=>".png","image/webp"=>".webp",_=>".jpg"}; var name=$"{Guid.NewGuid():N}{ext}"; var root=Path.Combine(contentRoot,"uploads"); Directory.CreateDirectory(root);validated.Position=0;await using var output=new FileStream(Path.Combine(root,name),FileMode.CreateNew,FileAccess.Write,FileShare.None,81920,true); await validated.CopyToAsync(output,ct); return name; }
 public Task DeleteAsync(string key,CancellationToken ct) { var path=Path.Combine(contentRoot,"uploads",Path.GetFileName(key)); if(File.Exists(path)) File.Delete(path); return Task.CompletedTask; }
}
