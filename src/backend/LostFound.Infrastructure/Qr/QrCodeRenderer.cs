using System.Text;
using LostFound.Application.Abstractions;
using QRCoder;

namespace LostFound.Infrastructure.Qr;
public sealed class QrCodeRenderer : IQrCodeRenderer
{
 public QrRenderedImage Render(string payload,QrImageFormat format)
 {
  if(!Uri.TryCreate(payload,UriKind.Absolute,out var uri)||uri.Scheme is not ("http" or "https"))throw new ArgumentException("A valid public HTTP URL is required.",nameof(payload));
  using var generator=new QRCodeGenerator();using var data=generator.CreateQrCode(payload,QRCodeGenerator.ECCLevel.Q,forceUtf8:true);
  if(format==QrImageFormat.Png){using var qr=new PngByteQRCode(data);return new(qr.GetGraphic(12),"image/png","png");}
  using var svg=new SvgQRCode(data);return new(Encoding.UTF8.GetBytes(svg.GetGraphic(8,"#102033","#ffffff",drawQuietZones:true,SvgQRCode.SizingMode.ViewBoxAttribute)),"image/svg+xml","svg");
 }
}
