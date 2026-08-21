using LostFound.Domain.Entities;

namespace LostFound.Application.Contracts;

public sealed record CategoryResponse(Guid Id, string Slug, string NameKey, IReadOnlyList<SubcategoryResponse> Subcategories);
public sealed record SubcategoryResponse(Guid Id, string Slug, string NameKey);
public sealed record ItemPhotoResponse(Guid Id, string Url, int SortOrder);
public sealed record ItemResponse(Guid Id, bool CanManage, ItemType Type, ItemStatus Status, string Title, string Description, Guid CategoryId, Guid? SubcategoryId, string? Brand, string? Color, string Location, double? Latitude, double? Longitude, DateTime OccurredAtUtc, decimal? RewardAmount, int ViewCount, DateTime CreatedAtUtc, IReadOnlyDictionary<string,string> Attributes, IReadOnlyList<ItemPhotoResponse> Photos, bool IsFavorite);
public sealed record ItemPosterResponse(string DisplayName,string? PhotoUrl,decimal? Rating,int RatingCount,int SuccessfulReturns,bool ContactSharingEnabled);
public sealed record PagedResponse<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount);
public sealed record CreateItemRequest(ItemType Type, string Title, string Description, Guid CategoryId, Guid? SubcategoryId, string? Brand, string? Color, string Location, double? Latitude, double? Longitude, DateTime OccurredAtUtc, decimal? RewardAmount, Dictionary<string,string>? Attributes, IReadOnlyList<string>? VerificationQuestions);
public sealed record UpdateItemRequest(string Title, string Description, Guid CategoryId, Guid? SubcategoryId, string? Brand, string? Color, string Location, double? Latitude, double? Longitude, DateTime OccurredAtUtc, decimal? RewardAmount, ItemStatus Status, Dictionary<string,string>? Attributes);
