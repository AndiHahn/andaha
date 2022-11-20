using Ardalis.SmartEnum;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Collections;
using System.Reflection;

namespace Andaha.Services.BudgetPlan.Common;

public sealed class SmartEnumSchemaFilter : ISchemaFilter
{
    public void Apply(OpenApiSchema schema, SchemaFilterContext context)
    {
        var type = context.Type;

        if (!IsTypeDerivedFromGenericType(type, typeof(SmartEnum<>)))
        {
            return;
        }

        var listProperty = type.GetProperty("List", BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy);
        var enumValues = (IEnumerable)listProperty.GetValue(null);
        var openApiValues = new OpenApiArray();
        foreach (var value in enumValues)
        {
            openApiValues.Add(new OpenApiString(value.ToString()));
        }

        // See https://swagger.io/docs/specification/data-models/enums/
        schema.Type = "string";
        schema.Enum = openApiValues;
        schema.Properties = null;
    }

    private static bool IsTypeDerivedFromGenericType(Type typeToCheck, Type genericType)
    {
        if (typeToCheck == typeof(object))
        {
            return false;
        }

        if (typeToCheck == null)
        {
            return false;
        }

        if (typeToCheck.IsGenericType && typeToCheck.GetGenericTypeDefinition() == genericType)
        {
            return true;
        }

        return IsTypeDerivedFromGenericType(typeToCheck.BaseType, genericType);
    }
}
