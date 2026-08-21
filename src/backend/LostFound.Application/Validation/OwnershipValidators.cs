using FluentValidation;
using LostFound.Application.Contracts;

namespace LostFound.Application.Validation;
public sealed class SetVerificationQuestionsRequestValidator:AbstractValidator<SetVerificationQuestionsRequest>{public SetVerificationQuestionsRequestValidator(){RuleFor(x=>x.Questions).NotNull().Must(x=>x.Count is >=1 and <=5);RuleForEach(x=>x.Questions).NotEmpty().MinimumLength(8).MaximumLength(240);}}
public sealed class CreateClaimRequestValidator:AbstractValidator<CreateClaimRequest>{public CreateClaimRequestValidator(){RuleForEach(x=>x.Answers).SetValidator(new ClaimAnswerRequestValidator()).When(x=>x.Answers is not null);}}
public sealed class ClaimAnswerRequestValidator:AbstractValidator<ClaimAnswerRequest>{public ClaimAnswerRequestValidator(){RuleFor(x=>x.QuestionId).NotEmpty();RuleFor(x=>x.Answer).NotEmpty().MinimumLength(1).MaximumLength(1000);}}
public sealed class SubmitClaimAnswersRequestValidator:AbstractValidator<SubmitClaimAnswersRequest>{public SubmitClaimAnswersRequestValidator(){RuleFor(x=>x.Answers).NotEmpty().Must(x=>x.Select(a=>a.QuestionId).Distinct().Count()==x.Count).WithMessage("Duplicate question answers are not allowed.");RuleForEach(x=>x.Answers).SetValidator(new ClaimAnswerRequestValidator());}}
public sealed class VerifyExchangeCodeRequestValidator:AbstractValidator<VerifyExchangeCodeRequest>{public VerifyExchangeCodeRequestValidator(){RuleFor(x=>x.Code).Matches("^[0-9]{6}$");}}
public sealed class CreateQrTagRequestValidator:AbstractValidator<CreateQrTagRequest>{public CreateQrTagRequestValidator(){RuleFor(x=>x.Label).NotEmpty().MaximumLength(120);RuleFor(x=>x.Description).MaximumLength(500);}}
public sealed class QrContactRequestValidator:AbstractValidator<QrContactRequest>{public QrContactRequestValidator(){RuleFor(x=>x.Message).NotEmpty().MaximumLength(1000);RuleFor(x=>x.CoarseLocation).MaximumLength(120);}}
