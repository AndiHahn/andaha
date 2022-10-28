﻿// <auto-generated />
using System;
using Andaha.Services.Shopping.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

#nullable disable

namespace Andaha.Services.Shopping.Infrastructure.Migrations
{
    [DbContext(typeof(ShoppingDbContext))]
    [Migration("20221026172006_AddedBillCreatedDate")]
    partial class AddedBillCreatedDate
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "6.0.9")
                .HasAnnotation("Relational:MaxIdentifierLength", 128);

            SqlServerModelBuilderExtensions.UseIdentityColumns(modelBuilder, 1L, 1);

            modelBuilder.Entity("Andaha.Services.Shopping.Core.Bill", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid>("CategoryId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<DateTime>("CreatedAt")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("datetime2")
                        .HasDefaultValueSql("GETDATE()");

                    b.Property<DateTime>("Date")
                        .HasColumnType("datetime2");

                    b.Property<string>("Notes")
                        .HasMaxLength(1000)
                        .HasColumnType("nvarchar(1000)");

                    b.Property<double>("Price")
                        .HasColumnType("float");

                    b.Property<string>("ShopName")
                        .IsRequired()
                        .HasMaxLength(200)
                        .IsUnicode(false)
                        .HasColumnType("varchar(200)");

                    b.Property<Guid>("UserId")
                        .HasColumnType("uniqueidentifier");

                    b.HasKey("Id");

                    b.HasIndex("CategoryId");

                    b.ToTable("Bill");
                });

            modelBuilder.Entity("Andaha.Services.Shopping.Core.BillCategory", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<string>("Color")
                        .IsRequired()
                        .HasMaxLength(20)
                        .IsUnicode(false)
                        .HasColumnType("varchar(20)");

                    b.Property<bool>("IsDefault")
                        .HasColumnType("bit");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(200)
                        .IsUnicode(false)
                        .HasColumnType("varchar(200)");

                    b.Property<Guid>("UserId")
                        .HasColumnType("uniqueidentifier");

                    b.HasKey("Id");

                    b.ToTable("BillCategory");
                });

            modelBuilder.Entity("Andaha.Services.Shopping.Core.Bill", b =>
                {
                    b.HasOne("Andaha.Services.Shopping.Core.BillCategory", "Category")
                        .WithMany("Bills")
                        .HasForeignKey("CategoryId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Category");
                });

            modelBuilder.Entity("Andaha.Services.Shopping.Core.BillCategory", b =>
                {
                    b.Navigation("Bills");
                });
#pragma warning restore 612, 618
        }
    }
}
