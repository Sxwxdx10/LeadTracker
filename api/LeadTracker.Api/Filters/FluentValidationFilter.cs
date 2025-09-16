using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;

namespace LeadTracker.Api.Filters;

/// <summary>
/// Filter to integrate FluentValidation with ModelState
/// </summary>
public class FluentValidationFilter : IAsyncActionFilter
{
    private readonly IServiceProvider _serviceProvider;

    public FluentValidationFilter(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var logger = _serviceProvider.GetRequiredService<ILogger<FluentValidationFilter>>();
        
        foreach (var parameter in context.ActionDescriptor.Parameters)
        {
            if (context.ActionArguments.TryGetValue(parameter.Name, out var argument) && argument != null)
            {
                logger.LogInformation("FluentValidationFilter: Validating {ParameterType}", argument.GetType().Name);
                
                var validatorType = typeof(IValidator<>).MakeGenericType(argument.GetType());
                var validator = _serviceProvider.GetService(validatorType) as IValidator;

                if (validator != null)
                {
                    logger.LogInformation("FluentValidationFilter: Found validator for {ParameterType}", argument.GetType().Name);
                    
                    var validationContext = new ValidationContext<object>(argument);
                    var validationResult = await validator.ValidateAsync(validationContext);

                    if (!validationResult.IsValid)
                    {
                        logger.LogWarning("FluentValidationFilter: Validation failed for {ParameterType} with {ErrorCount} errors", 
                            argument.GetType().Name, validationResult.Errors.Count);
                        
                        foreach (var error in validationResult.Errors)
                        {
                            logger.LogWarning("FluentValidationFilter: Error - {PropertyName}: {ErrorMessage}", 
                                error.PropertyName, error.ErrorMessage);
                            context.ModelState.AddModelError(error.PropertyName, error.ErrorMessage);
                        }
                    }
                    else
                    {
                        logger.LogInformation("FluentValidationFilter: Validation passed for {ParameterType}", argument.GetType().Name);
                    }
                }
                else
                {
                    logger.LogInformation("FluentValidationFilter: No validator found for {ParameterType}", argument.GetType().Name);
                }
            }
        }

        if (!context.ModelState.IsValid)
        {
            logger.LogWarning("FluentValidationFilter: ModelState is invalid, returning BadRequest");
            context.Result = new BadRequestObjectResult(context.ModelState);
            return;
        }

        await next();
    }
}
