using FluentAssertions;
using LostFound.Application.Contracts;
using LostFound.Application.Validation;
using LostFound.Domain.Entities;

namespace LostFound.Tests;
public sealed class ListingValidationTests
{
 [Fact] public void Create_rejects_missing_public_fields_and_invalid_coordinates() { var request=new CreateItemRequest(ItemType.Lost,"","",Guid.Empty,null,null,null,"",91,181,DateTime.UtcNow,-1,null,null); var result=new CreateItemRequestValidator().Validate(request); result.IsValid.Should().BeFalse(); result.Errors.Select(x=>x.PropertyName).Should().Contain(["Title","Description","CategoryId","Location","Latitude","Longitude","RewardAmount"]); }
 [Fact] public void Public_item_contract_has_no_ownership_verification_members() { typeof(ItemResponse).GetProperties().Select(x=>x.Name).Should().NotContain(x=>x.Contains("Question",StringComparison.OrdinalIgnoreCase)||x.Contains("Answer",StringComparison.OrdinalIgnoreCase)); }
 [Fact] public void Create_limits_private_verification_questions() { var request=new CreateItemRequest(ItemType.Found,"Bag","Black bag",Guid.NewGuid(),null,null,null,"Tbilisi",41.7,44.8,DateTime.UtcNow,null,null,Enumerable.Range(1,6).Select(x=>$"Question {x}").ToList()); new CreateItemRequestValidator().Validate(request).IsValid.Should().BeFalse(); }
}
