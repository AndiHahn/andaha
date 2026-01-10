using Ardalis.SmartEnum;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Collections;
using System.Reflection;
using System.Text.Json.Nodes;

namespace Andaha.CrossCutting.Application.Swagger;

public sealed class SmartEnumSchemaFilter : ISchemaFilter
{
    public void Apply(IOpenApiSchema schema, SchemaFilterContext context)
    {
        var type = context.Type;

        if (!IsTypeDerivedFromGenericType(type, typeof(SmartEnum<>)))
        {
            return;
        }

        var listProperty = type.GetProperty("List", BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy);
        var enumValues = (IEnumerable)listProperty.GetValue(null);

        var stringValues = enumValues
            .Cast<object>()
            .Select(v => (object)v.ToString())
            .ToList();

        // Clear existing properties and set enum values
        schema?.Properties?.Clear();
        schema?.Enum?.Clear();

        foreach (var value in enumValues)
        {
            schema?.Enum?.Add(JsonValue.Create(value.ToString()));
        }
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

        return IsTypeDerivedFromGenericType(typeToCheck.BaseType!, genericType);
    }
}
