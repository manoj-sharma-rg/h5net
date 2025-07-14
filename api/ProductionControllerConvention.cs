using Microsoft.AspNetCore.Mvc.ApplicationModels;

namespace api;

public class ProductionControllerConvention : IApplicationModelConvention
{
    private readonly string[] _excludedControllers;

    public ProductionControllerConvention(string[] excludedControllers)
    {
        _excludedControllers = excludedControllers;
    }

    public void Apply(ApplicationModel application)
    {
        var controllersToRemove = application.Controllers
            .Where(c => _excludedControllers.Contains(c.ControllerName))
            .ToList();

        foreach (var controller in controllersToRemove)
        {
            application.Controllers.Remove(controller);
        }
    }
} 