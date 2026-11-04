using Andaha.CrossCutting.Application.Identity;
using Andaha.Services.Shopping.Core;
using Andaha.Services.Shopping.Infrastructure;
using Andaha.Services.Shopping.Requests.BillCategory.Dtos.V1;
using Andaha.Services.Shopping.Requests.BillCategory.DeleteBillCategory.V1;
using Andaha.Services.Shopping.Requests.BillCategory.UpdateBillCategory.V1;
using Andaha.Services.Shopping.Requests.BillTemplate.CreateBillTemplate.V1;
using Andaha.Services.Shopping.Requests.BillTemplate.DeleteBillTemplate.V1;
using Andaha.Services.Shopping.Requests.BillTemplate.Dtos.V1;
using Andaha.Services.Shopping.Requests.BillTemplate.ListBillTemplates.V1;
using Andaha.Services.Shopping.Requests.BillTemplate.UpdateBillTemplate.V1;
using Andaha.Services.Shopping.Requests.BillTemplate.UpdateBillTemplateOrder.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace Andaha.Services.Shopping.Tests.BillTemplate;

public class BillTemplateHandlerTests
{
    private static readonly Guid UserA = Guid.NewGuid();
    private static readonly Guid UserB = Guid.NewGuid();

    private sealed record Fixture(
        ShoppingDbContext Context,
        IIdentityService Identity,
        Guid K1,
        Guid U1,
        Guid K2);

    private static Fixture Seed(ShoppingDbContext context, Guid currentUser)
    {
        var k1 = new BillCategory(UserA, "K1", "#111111", 0, new[] { ("U1", 0), ("U1b", 1) }, isDefault: true);
        var k2 = new BillCategory(UserA, "K2", "#222222", 1, new[] { ("U2", 0) });
        context.BillCategory.AddRange(k1, k2);
        context.SaveChanges();

        var identity = Substitute.For<IIdentityService>();
        identity.GetUserId().Returns(currentUser);

        return new Fixture(context, identity, k1.Id, k1.SubCategories.First(s => s.Name == "U1").Id, k2.Id);
    }

    private static Core.BillTemplate AddTemplate(Fixture f, Guid userId, int sortOrder, Guid? categoryId = null, Guid? subCategoryId = null)
    {
        var template = new Core.BillTemplate(userId, "T" + sortOrder, "Shop", categoryId ?? f.K1, subCategoryId, sortOrder);
        f.Context.BillTemplate.Add(template);
        f.Context.SaveChanges();
        return template;
    }

    [Fact]
    public async Task Create_appends_with_next_sort_order()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context, UserA);
            var handler = new CreateBillTemplateCommandHandler(f.Context, f.Identity);

            var first = await handler.Handle(new CreateBillTemplateCommand("A", "Shop", f.K1, null), CancellationToken.None);
            var second = await handler.Handle(new CreateBillTemplateCommand("B", "Shop", f.K1, f.U1), CancellationToken.None);

            Assert.Equal(0, Assert.IsType<Ok<BillTemplateDto>>(first).Value!.SortOrder);
            var dto = Assert.IsType<Ok<BillTemplateDto>>(second).Value!;
            Assert.Equal(1, dto.SortOrder);
            Assert.Equal(f.U1, dto.SubCategoryId);
            Assert.Equal(2, context.BillTemplate.Count());
        }
    }

    [Fact]
    public async Task Create_with_blank_shop_stores_null()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context, UserA);
            var handler = new CreateBillTemplateCommandHandler(f.Context, f.Identity);

            var result = await handler.Handle(new CreateBillTemplateCommand("  Wocheneinkauf ", "  ", f.K1, null), CancellationToken.None);

            var dto = Assert.IsType<Ok<BillTemplateDto>>(result).Value!;
            Assert.Null(dto.ShopName);
            Assert.Equal("Wocheneinkauf", dto.Name);
            var stored = context.BillTemplate.AsNoTracking().Single();
            Assert.Null(stored.ShopName);
            Assert.Equal("Wocheneinkauf", stored.Name);
        }
    }

    [Fact]
    public async Task Create_trims_shop_name()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context, UserA);
            var handler = new CreateBillTemplateCommandHandler(f.Context, f.Identity);

            await handler.Handle(new CreateBillTemplateCommand(null, "  Rewe ", f.K1, null), CancellationToken.None);

            Assert.Equal("Rewe", context.BillTemplate.AsNoTracking().Single().ShopName);
        }
    }

    [Fact]
    public async Task List_returns_only_own_templates_sorted()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context, UserA);
            var second = AddTemplate(f, UserA, 1);
            var first = AddTemplate(f, UserA, 0);
            AddTemplate(f, UserB, 0);
            var handler = new ListBillTemplatesQueryHandler(f.Context, f.Identity);

            var result = await handler.Handle(new ListBillTemplatesQuery(), CancellationToken.None);

            var list = Assert.IsType<Ok<BillTemplateDto[]>>(result).Value!;
            Assert.Equal(new[] { first.Id, second.Id }, list.Select(t => t.Id));
        }
    }

    [Fact]
    public async Task Update_changes_fields()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context, UserA);
            var template = AddTemplate(f, UserA, 0);
            var handler = new UpdateBillTemplateCommandHandler(f.Context, f.Identity);

            var result = await handler.Handle(
                new UpdateBillTemplateCommand(template.Id, "Neu", " Lidl ", f.K2, null), CancellationToken.None);

            Assert.IsType<NoContent>(result);
            var stored = context.BillTemplate.AsNoTracking().Single();
            Assert.Equal("Neu", stored.Name);
            Assert.Equal("Lidl", stored.ShopName);
            Assert.Equal(f.K2, stored.CategoryId);
        }
    }

    [Fact]
    public async Task Update_foreign_template_returns_not_found()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context, UserA);
            var foreign = AddTemplate(f, UserB, 0);
            var handler = new UpdateBillTemplateCommandHandler(f.Context, f.Identity);

            var result = await handler.Handle(
                new UpdateBillTemplateCommand(foreign.Id, "X", null, f.K1, null), CancellationToken.None);

            Assert.IsType<NotFound>(result);
            Assert.Equal("T0", context.BillTemplate.AsNoTracking().Single().Name);
        }
    }

    [Fact]
    public async Task Delete_removes_own_template()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context, UserA);
            var template = AddTemplate(f, UserA, 0);
            var handler = new DeleteBillTemplateCommandHandler(f.Context, f.Identity);

            var result = await handler.Handle(new DeleteBillTemplateCommand(template.Id), CancellationToken.None);

            Assert.IsType<NoContent>(result);
            Assert.Empty(context.BillTemplate);
        }
    }

    [Fact]
    public async Task Delete_foreign_template_returns_not_found()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context, UserA);
            var foreign = AddTemplate(f, UserB, 0);
            var handler = new DeleteBillTemplateCommandHandler(f.Context, f.Identity);

            var result = await handler.Handle(new DeleteBillTemplateCommand(foreign.Id), CancellationToken.None);

            Assert.IsType<NotFound>(result);
            Assert.Equal(1, context.BillTemplate.Count());
        }
    }

    [Fact]
    public async Task Update_order_sets_sort_order_in_given_sequence()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context, UserA);
            var a = AddTemplate(f, UserA, 0);
            var b = AddTemplate(f, UserA, 1);
            var c = AddTemplate(f, UserA, 2);
            var handler = new UpdateBillTemplateOrderCommandHandler(f.Context, f.Identity);

            var result = await handler.Handle(
                new UpdateBillTemplateOrderCommand(new[] { c.Id, a.Id, b.Id }), CancellationToken.None);

            Assert.IsType<NoContent>(result);
            var stored = context.BillTemplate.AsNoTracking().ToDictionary(t => t.Id, t => t.SortOrder);
            Assert.Equal(0, stored[c.Id]);
            Assert.Equal(1, stored[a.Id]);
            Assert.Equal(2, stored[b.Id]);
        }
    }

    [Fact]
    public async Task Deleting_category_removes_its_templates_and_hidden_suggestions()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context, UserA);
            AddTemplate(f, UserA, 0, f.K2);
            AddTemplate(f, UserA, 1, f.K1);
            context.HiddenBillSuggestion.Add(new HiddenBillSuggestion(UserA, "Rewe", f.K2, null));
            context.HiddenBillSuggestion.Add(new HiddenBillSuggestion(UserA, "Aldi", f.K1, null));
            context.SaveChanges();
            var handler = new DeleteBillCategoryCommandHandler(f.Context, f.Identity);

            var result = await handler.Handle(new DeleteBillCategoryCommand(f.K2), CancellationToken.None);

            Assert.IsType<NoContent>(result);
            Assert.Equal(f.K1, context.BillTemplate.AsNoTracking().Single().CategoryId);
            Assert.Equal("Aldi", context.HiddenBillSuggestion.AsNoTracking().Single().ShopName);
        }
    }

    [Fact]
    public async Task Deleting_category_with_subcategory_references_removes_them()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context, UserA);
            var k3 = new BillCategory(UserA, "K3", "#333333", 2, new[] { ("U3", 0) });
            context.BillCategory.Add(k3);
            context.SaveChanges();
            var u3 = k3.SubCategories.Single().Id;
            AddTemplate(f, UserA, 0, k3.Id, u3);
            context.HiddenBillSuggestion.Add(new HiddenBillSuggestion(UserA, "Rewe", k3.Id, u3));
            context.SaveChanges();
            var handler = new DeleteBillCategoryCommandHandler(f.Context, f.Identity);

            await handler.Handle(new DeleteBillCategoryCommand(k3.Id), CancellationToken.None);

            Assert.Empty(context.BillTemplate);
            Assert.Empty(context.HiddenBillSuggestion);
        }
    }

    [Fact]
    public async Task Deleting_subcategory_clears_template_subcategory_and_removes_hidden_suggestions()
    {
        var (context, connection) = TestDb.CreateShopping();
        using (connection)
        using (context)
        {
            var f = Seed(context, UserA);
            var template = AddTemplate(f, UserA, 0, f.K1, f.U1);
            context.HiddenBillSuggestion.Add(new HiddenBillSuggestion(UserA, "Rewe", f.K1, f.U1));
            context.HiddenBillSuggestion.Add(new HiddenBillSuggestion(UserA, "Aldi", f.K1, null));
            context.SaveChanges();
            var handler = new UpdateBillCategoryCommandHandler(f.Context, f.Identity);
            var remaining = context.BillSubCategory.AsNoTracking()
                .Where(s => s.CategoryId == f.K1 && s.Id != f.U1)
                .Select(s => new SubCategoryUpdateDto(s.Id, s.Name, s.Order))
                .ToList();

            var result = await handler.Handle(
                new UpdateBillCategoryCommand(f.K1, new CategoryUpdateDto("K1", "#111111", true, remaining)),
                CancellationToken.None);

            Assert.IsType<NoContent>(result);
            var stored = context.BillTemplate.AsNoTracking().Single(t => t.Id == template.Id);
            Assert.Null(stored.SubCategoryId);
            Assert.Equal(f.K1, stored.CategoryId);
            Assert.Equal("Aldi", context.HiddenBillSuggestion.AsNoTracking().Single().ShopName);
        }
    }
}
