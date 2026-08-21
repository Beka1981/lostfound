using FluentValidation;
using LostFound.Application.Contracts;
using LostFound.Domain.Entities;
namespace LostFound.Application.Validation;

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.AccountType).IsInEnum();
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.PhoneNumber).Must(x => !string.IsNullOrWhiteSpace(x)).MaximumLength(64);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).MaximumLength(128)
            .Matches("[A-Z]").WithMessage("Password must contain an uppercase Latin letter.")
            .Matches("[a-z]").WithMessage("Password must contain a lowercase Latin letter.")
            .Matches("[0-9]").WithMessage("Password must contain a digit.");
        When(x => x.AccountType == AccountType.Person, () =>
        {
            RuleFor(x => x.FirstName).Must(x => !string.IsNullOrWhiteSpace(x)).MaximumLength(80);
            RuleFor(x => x.LastName).Must(x => !string.IsNullOrWhiteSpace(x)).MaximumLength(80);
        });
        When(x => x.AccountType == AccountType.Organization, () =>
        {
            RuleFor(x => x.OrganizationName).Must(x => !string.IsNullOrWhiteSpace(x)).MaximumLength(160);
            RuleFor(x => x.ResponsiblePerson).Must(x => !string.IsNullOrWhiteSpace(x)).MaximumLength(160);
        });
    }
}
public sealed class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest> { public UpdateProfileRequestValidator() { RuleFor(x => x.FirstName).MaximumLength(100); RuleFor(x => x.LastName).MaximumLength(100); RuleFor(x => x.OrganizationName).MaximumLength(180); RuleFor(x => x.ResponsiblePerson).MaximumLength(180); RuleFor(x => x.PhoneNumber).MaximumLength(30); RuleFor(x => x.Language).Must(x => x is "ka" or "en" or "ru"); RuleFor(x => x.Theme).Must(x => x is "light" or "dark"); } }
public sealed class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest> { public ChangePasswordRequestValidator() { RuleFor(x => x.CurrentPassword).NotEmpty(); RuleFor(x => x.NewPassword).MinimumLength(10).Matches("[A-Z]").Matches("[a-z]").Matches("[0-9]"); } }
public sealed class SendMessageRequestValidator : AbstractValidator<SendMessageRequest> { public SendMessageRequestValidator() { RuleFor(x => x.Body).NotEmpty().MaximumLength(4000); } }
public sealed class ReportRequestValidator : AbstractValidator<ReportRequest> { public ReportRequestValidator() { RuleFor(x => new[] { x.ItemId, x.ReportedUserId, x.MessageId }.Count(v => v.HasValue)).Equal(1).WithMessage("Exactly one report target is required."); RuleFor(x => x.Reason).NotEmpty().MaximumLength(80); RuleFor(x => x.Details).MaximumLength(2000); } }
public sealed class RatingRequestValidator : AbstractValidator<RatingRequest> { public RatingRequestValidator() { RuleFor(x => x.ExchangeId).NotEmpty(); RuleFor(x => x.Score).InclusiveBetween(1, 5); RuleFor(x => x.Review).MaximumLength(2000); } }
