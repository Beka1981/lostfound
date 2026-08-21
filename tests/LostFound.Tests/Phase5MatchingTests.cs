using FluentAssertions;
using LostFound.Domain.Entities;
using LostFound.Infrastructure.Matching;
using LostFound.Application.Abstractions;

namespace LostFound.Tests;
public sealed class Phase5MatchingTests {
 static Item Item(ItemType type,string title="Black Backpack",double? latitude=41.7151,double? longitude=44.8271)=>new(){Type=type,Status=ItemStatus.Active,CategoryId=Guid.Parse("33333333-3333-3333-3333-333333333333"),SubcategoryId=Guid.Parse("aaaaaaaa-0000-0000-0000-000000000007"),Title=title,Description="backpack with books and water bottle",Brand="Herschel",Color="Black",Location="Vake Park Tbilisi",Latitude=latitude,Longitude=longitude,OccurredAtUtc=new DateTime(2026,8,19,12,0,0,DateTimeKind.Utc),Attributes=[new(){Key="material",Value="nylon"}]};
 [Fact]public void Score_IsDeterministicAndBounded(){var a=Item(ItemType.Lost);var b=Item(ItemType.Found);var first=DeterministicMatchingService.Score(a,b);var second=DeterministicMatchingService.Score(a,b);first.Score.Should().Be(second.Score).And.BeInRange(0,100);first.Score.Should().BeGreaterThan(82);}
 [Fact]public void MissingOptionalData_DoesNotProduceInvalidScore(){var a=Item(ItemType.Lost,"bag",null,null);var b=Item(ItemType.Found,"bag",null,null);a.Brand=a.Color="";b.Brand=b.Color="";var result=DeterministicMatchingService.Score(a,b);result.Score.Should().BeInRange(0,100);result.Parts.Should().NotContain(x=>x.Key=="distance");}
 [Fact]public void CategoryAndAttributes_AffectExplainableScore(){var a=Item(ItemType.Lost);var b=Item(ItemType.Found);var result=DeterministicMatchingService.Score(a,b);result.Parts.Should().Contain(x=>x.Key=="category"&&x.Score==25);result.Parts.Should().Contain(x=>x.Key=="attributes"&&x.Detail=="material");}
 [Fact]public void GeographicDistance_IsStableAndFinite(){var km=DeterministicMatchingService.Distance(41.7151,44.8271,41.72,44.80);km.Should().BeGreaterThan(0).And.BeLessThan(5);double.IsFinite(km).Should().BeTrue();}
 [Fact]public void MatchStates_PreserveLegacyNumericValues(){((int)MatchStatus.Suggested).Should().Be(0);((int)MatchStatus.Dismissed).Should().Be(1);((int)MatchStatus.Confirmed).Should().Be(2);}
 [Fact]public async Task DisabledAiProvider_ReturnsNoFabricatedScores(){IAiMatchingProvider provider=new NoOpAiMatchingProvider();var result=await provider.ScoreAsync(new(Guid.NewGuid(),[Guid.NewGuid()]),CancellationToken.None);result.Should().BeEmpty();}
 [Fact]public async Task DisabledImageProvider_RequiresManualReview(){IImageModerationService provider=new ManualReviewImageModerationService();await using var image=new MemoryStream([1,2,3]);var result=await provider.CheckAsync(image,CancellationToken.None);result.Outcome.Should().Be(ModerationOutcome.ReviewRequired);result.ReasonCodes.Should().Contain("provider_disabled");}
}
