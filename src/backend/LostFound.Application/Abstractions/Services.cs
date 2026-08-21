using LostFound.Domain.Entities;
namespace LostFound.Application.Abstractions;
public interface IFileStorageService { Task<string> SaveImageAsync(Stream content, string contentType, CancellationToken cancellationToken); Task DeleteAsync(string storageKey, CancellationToken cancellationToken); }
public interface IItemMatchingService { Task<IReadOnlyList<ItemMatchScore>> FindMatchesAsync(Guid itemId, CancellationToken cancellationToken); }
public sealed record ItemMatchScore(Guid ItemId, decimal Score);
public interface IMatchingJobQueue { Task EnqueueAsync(Guid itemId,CancellationToken cancellationToken); }
public interface INotificationPublisher { Task PublishAsync(Guid userId, string type, object payload, CancellationToken cancellationToken); }
public interface IAiMatchingProvider { Task<IReadOnlyDictionary<Guid,decimal>> ScoreAsync(MatchingProviderRequest request, CancellationToken cancellationToken); }
public sealed record MatchingProviderRequest(Guid SourceItemId,IReadOnlyList<Guid> CandidateItemIds);
public interface ITextModerationService { Task<ModerationResult> CheckAsync(string text, CancellationToken cancellationToken); }
public interface IImageModerationService { Task<ModerationResult> CheckAsync(Stream image, CancellationToken cancellationToken); }
public sealed record ModerationResult(ModerationOutcome Outcome, IReadOnlyList<string> ReasonCodes, string PolicyVersion) { public bool IsAllowed => Outcome==ModerationOutcome.Allowed; }
public interface IQrCodeRenderer { QrRenderedImage Render(string payload, QrImageFormat format); }
public enum QrImageFormat { Svg, Png }
public sealed record QrRenderedImage(byte[] Content,string ContentType,string FileExtension);
