using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Andaha.CrossCutting.Application.Result;
public static class ControllerExtensions
{
    public static IActionResult ToActionResult(this ControllerBase controller, IResult result)
    {
        ObjectResult ProblemDetails(string title, int status)
            => controller.Problem(result.ErrorMessage, null, status, title, GetType(status));

        ActionResult ValidationProblemDetails(string title, int status)
        {
            ModelStateDictionary errors = new ModelStateDictionary();
            foreach (var error in result.ValidationErrors)
            {
                errors.AddModelError(error.PropertyName, error.ErrorMessage);
            }

            return controller.ValidationProblem(result.ErrorMessage, null, status, title, GetType(status), errors);
        }

        object GetResultValue(IResult result)
        {
            if (result is IPagedResult pagedResult)
            {
                Type dtoType = typeof(PagedResultDto<>).MakeGenericType(pagedResult.GetValueType());
                return Activator.CreateInstance(dtoType, pagedResult.GetValue()!, pagedResult.TotalCount)!;
            }

            return result.GetValue()!;
        }

        return result.Status switch
        {
            ResultStatus.Success => controller.Ok(GetResultValue(result)),
            ResultStatus.SuccessNoResult => controller.NoContent(),
            ResultStatus.BadRequest => ValidationProblemDetails("Bad Request", StatusCodes.Status400BadRequest),
            ResultStatus.Unauthorized => ProblemDetails("Unauthorized", StatusCodes.Status401Unauthorized),
            ResultStatus.Forbidden => ProblemDetails("Forbidden", StatusCodes.Status403Forbidden),
            ResultStatus.NotFound => ProblemDetails("Not Found", StatusCodes.Status404NotFound),
            _ => throw new ArgumentOutOfRangeException(nameof(result.Status), $"Value {result.Status} cannot be mapped to a http status code.")
        };
    }

    private static string GetType(int status) => $"https://http.cat/{status}";
}
