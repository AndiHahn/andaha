#nullable enable

using FluentValidation.Results;

namespace Andaha.CrossCutting.Application.Result
{
    public class Result : IResult
    {
        protected Result(ResultStatus status, IList<ValidationFailure> errors)
        {
            this.Status = status;
            this.ValidationErrors = errors;
        }

        protected Result(ResultStatus status, string? error = null)
        {
            this.Status = status;
            this.ErrorMessage = error;
        }

        public ResultStatus Status { get; protected set; }

        public string? ErrorMessage { get; protected set; }

        public IList<ValidationFailure>? ValidationErrors { get; protected set; }

        public object? GetValue() => null;

        public static Result Success() => new(ResultStatus.SuccessNoResult);

        public static Result Error(IList<ValidationFailure> failures) => new(ResultStatus.BadRequest, failures);

        public static Result Unauthorized(string? error = null) => new(ResultStatus.Unauthorized, error);

        public static Result Forbidden(string? error = null) => new(ResultStatus.Forbidden, error);

        public static Result NotFound(string? error = null) => new(ResultStatus.NotFound, error);
    }

    public class Result<T> : Result, IResult
    {
        protected Result(ResultStatus status, IList<ValidationFailure> errors)
            : base(status, errors)
        {
        }

        protected Result(ResultStatus status, string? error = null)
            : base(status, error)
        {
        }

        protected Result(T value)
            : base(ResultStatus.Success)
        {
           this.Value = value;
        }

        public T? Value { get; private set; }

        public static implicit operator T?(Result<T> result) => result.Value;

        public static implicit operator Result<T>(T value) => Success(value);

        public new object? GetValue() => this.Value;

        public static Result<T> Success(T value) => new Result<T>(value);

        public new static Result<T> Error(IList<ValidationFailure> failures) => new(ResultStatus.BadRequest, failures);

        public new static Result<T> Unauthorized(string? error = null) => new(ResultStatus.Unauthorized, error);

        public new static Result<T> Forbidden(string? error = null) => new(ResultStatus.Forbidden, error);

        public new static Result<T> NotFound(string? error = null) => new(ResultStatus.NotFound, error);
        
        public Result<TTarget> MapToResult<TTarget>(Func<T, TTarget> mapFunc)
        {
            if (this.Status == ResultStatus.Success)
            {
                return new Result<TTarget>(mapFunc(this.Value!));
            }

            if (this.ValidationErrors is not null)
            {
                return new Result<TTarget>(this.Status, this.ValidationErrors);
            }

            return new Result<TTarget>(this.Status, this.ErrorMessage);
        }
    }
}
