using LostFound.Domain.Entities;

namespace LostFound.Application.Contracts;

public sealed record VerificationQuestionResponse(Guid Id,string Prompt,int SortOrder);
public sealed record SetVerificationQuestionsRequest(IReadOnlyList<string> Questions);
public sealed record CreateClaimRequest(IReadOnlyList<ClaimAnswerRequest>? Answers);
public sealed record ClaimAnswerRequest(Guid QuestionId,string Answer);
public sealed record SubmitClaimAnswersRequest(IReadOnlyList<ClaimAnswerRequest> Answers);
public sealed record ClaimAnswerResponse(Guid QuestionId,string Question,string Answer);
public sealed record ClaimSummaryResponse(Guid Id,Guid ItemId,string ItemTitle,Guid ClaimantId,ClaimStatus Status,DateTime CreatedAtUtc,DateTime? ReviewedAtUtc,Guid? ExchangeId);
public sealed record ClaimDetailResponse(Guid Id,Guid ItemId,string ItemTitle,Guid ItemOwnerId,Guid ClaimantId,ClaimStatus Status,DateTime CreatedAtUtc,DateTime? ReviewedAtUtc,IReadOnlyList<VerificationQuestionResponse> Questions,IReadOnlyList<ClaimAnswerResponse>? Answers,Guid? ExchangeId);
public sealed record ReviewClaimRequest(bool Accept);
public sealed record ExchangeResponse(Guid Id,Guid ClaimId,Guid ItemId,Guid OwnerId,Guid ClaimantId,ExchangeStatus Status,DateTime? ExpiresAtUtc,int FailedAttempts,DateTime? LockedUntilUtc,DateTime? CompletedAtUtc,bool CanGenerateCode,bool CanEnterCode,bool CanRate);
public sealed record ExchangeCodeResponse(string Code,DateTime ExpiresAtUtc);
public sealed record VerifyExchangeCodeRequest(string Code);
public sealed record CreateQrTagRequest(string Label,string? Description,Guid? ItemId);
public sealed record UpdateQrStateRequest(bool IsActive);
public sealed record QrTagResponse(Guid Id,string Label,string? Description,Guid? ItemId,bool IsActive,bool IsRevoked,DateTime CreatedAtUtc,int ScanCount);
public sealed record QrTokenResponse(Guid Id,string Token,string PublicUrl);
public sealed record RenderQrRequest(string Token);
public sealed record PublicQrResponse(string Label,string? Description,bool CanContact);
public sealed record QrContactRequest(string Message,string? CoarseLocation);
public sealed record QrScanResponse(Guid Id,DateTime ScannedAtUtc,string? CoarseLocation,bool ContactRequested);
