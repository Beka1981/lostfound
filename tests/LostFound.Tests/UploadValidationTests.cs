using FluentAssertions;using LostFound.Infrastructure.Storage;
namespace LostFound.Tests;
public sealed class UploadValidationTests{
 [Fact]public async Task Rejects_MimeSpoofed_Image(){var root=Path.Combine(Path.GetTempPath(),$"lostfound-upload-{Guid.NewGuid():N}");try{var service=new LocalFileStorageService(root);var action=()=>service.SaveImageAsync(new MemoryStream("not a png"u8.ToArray()),"image/png",CancellationToken.None);await action.Should().ThrowAsync<InvalidOperationException>();Directory.Exists(Path.Combine(root,"uploads")).Should().BeFalse();}finally{if(Directory.Exists(root))Directory.Delete(root,true);}}
 [Fact]public async Task Stores_Png_WithGeneratedName(){var root=Path.Combine(Path.GetTempPath(),$"lostfound-upload-{Guid.NewGuid():N}");try{var service=new LocalFileStorageService(root);var png=new byte[]{137,80,78,71,13,10,26,10,0};var key=await service.SaveImageAsync(new MemoryStream(png),"image/png",CancellationToken.None);key.Should().EndWith(".png").And.NotContain("/");File.Exists(Path.Combine(root,"uploads",key)).Should().BeTrue();}finally{if(Directory.Exists(root))Directory.Delete(root,true);}}
}
