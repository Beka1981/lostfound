using FluentAssertions;
using LostFound.Application.Contracts;
using LostFound.Application.Validation;
using LostFound.Domain.Entities;

namespace LostFound.Tests;

public sealed class RegistrationValidationTests
{
    private readonly RegisterRequestValidator validator = new();

    [Fact]
    public async Task Valid_person_is_accepted()
    {
        RegisterRequest request = new(AccountType.Person,"name@example.com","Aa123456","Nino","Beridze",null,null,"+995 555-12-34-56"); var result = await validator.ValidateAsync(request);
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Valid_organization_is_accepted()
    {
        RegisterRequest request = new(AccountType.Organization,"office@example.com","Aa123456",null,null,"Foundly Georgia","Nino Beridze","(032) 212-34-56"); var result = await validator.ValidateAsync(request);
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("name")]
    [InlineData("name@")]
    [InlineData("@example.com")]
    [InlineData("name example.com")]
    public async Task Invalid_email_is_rejected(string email)
    {
        RegisterRequest request = new(AccountType.Person,email,"Aa123456","Nino","Beridze",null,null,"+995555123456"); var result = await validator.ValidateAsync(request);
        result.Errors.Should().Contain(x=>x.PropertyName=="Email");
    }

    [Theory]
    [InlineData("x")]
    [InlineData("123")]
    [InlineData("+995-ABC-123")]
    public async Task Any_non_empty_phone_is_accepted(string phone)
    {
        RegisterRequest request = new(AccountType.Person,"name@example.com","Aa123456","Nino","Beridze",null,null,phone); var result = await validator.ValidateAsync(request);
        result.Errors.Should().NotContain(x=>x.PropertyName=="PhoneNumber");
    }

    [Theory]
    [InlineData("aa123456")]
    [InlineData("AA123456")]
    [InlineData("Aaaaaaaa")]
    [InlineData("Aa12345")]
    public async Task Weak_password_is_rejected(string password)
    {
        RegisterRequest request = new(AccountType.Person,"name@example.com",password,"Nino","Beridze",null,null,"+995555123456"); var result = await validator.ValidateAsync(request);
        result.Errors.Should().Contain(x=>x.PropertyName=="Password");
    }

    [Fact]
    public async Task Organization_requires_responsible_person()
    {
        RegisterRequest request = new(AccountType.Organization,"office@example.com","Aa123456",null,null,"Foundly Georgia"," ","+995555123456"); var result = await validator.ValidateAsync(request);
        result.Errors.Should().Contain(x=>x.PropertyName=="ResponsiblePerson");
    }

    [Fact]
    public async Task One_character_person_names_are_accepted()
    {
        RegisterRequest request = new(AccountType.Person,"name@example.com","Aa123456","A","B",null,null,"x");
        var result = await validator.ValidateAsync(request);
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(null,null,"x")]
    [InlineData(" ","B","x")]
    [InlineData("A","\t","x")]
    [InlineData("A","B","  ")]
    public async Task Person_required_values_reject_null_or_whitespace(string? first,string? last,string? phone)
    {
        RegisterRequest request = new(AccountType.Person,"name@example.com","Aa123456",first,last,null,null,phone);
        var result = await validator.ValidateAsync(request);
        result.IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData(null,"Responsible","x")]
    [InlineData(" ","Responsible","x")]
    [InlineData("Organization","\t","x")]
    [InlineData("Organization","Responsible"," ")]
    public async Task Organization_required_values_reject_null_or_whitespace(string? organization,string? responsible,string? phone)
    {
        RegisterRequest request = new(AccountType.Organization,"office@example.com","Aa123456",null,null,organization,responsible,phone);
        var result = await validator.ValidateAsync(request);
        result.IsValid.Should().BeFalse();
    }
}
