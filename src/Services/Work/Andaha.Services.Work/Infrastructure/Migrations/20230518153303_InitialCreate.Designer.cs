﻿// <auto-generated />
using System;
using Andaha.Services.Work.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

#nullable disable

namespace Andaha.Services.Work.Infrastructure.Migrations
{
    [DbContext(typeof(WorkDbContext))]
    [Migration("20230518153303_InitialCreate")]
    partial class InitialCreate
    {
        /// <inheritdoc />
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "7.0.0")
                .HasAnnotation("Relational:MaxIdentifierLength", 128);

            SqlServerModelBuilderExtensions.UseIdentityColumns(modelBuilder);

            modelBuilder.Entity("Andaha.Services.Work.Core.Person", b =>
                {
                    b.Property<Guid>("Id")
                        .HasColumnType("uniqueidentifier");

                    b.Property<double>("HourlyRate")
                        .HasPrecision(4, 1)
                        .HasColumnType("float(4)");

                    b.Property<DateTime?>("LastPayed")
                        .HasColumnType("date");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(200)
                        .IsUnicode(false)
                        .HasColumnType("varchar(200)");

                    b.Property<string>("Notes")
                        .HasMaxLength(1000)
                        .HasColumnType("nvarchar(1000)");

                    b.Property<double>("PayedHous")
                        .HasColumnType("float");

                    b.Property<Guid>("UserId")
                        .HasColumnType("uniqueidentifier");

                    b.HasKey("Id");

                    b.HasIndex("Name");

                    b.ToTable("Person");
                });

            modelBuilder.Entity("Andaha.Services.Work.Core.WorkingEntry", b =>
                {
                    b.Property<Guid>("Id")
                        .HasColumnType("uniqueidentifier");

                    b.Property<TimeSpan>("Break")
                        .HasColumnType("time");

                    b.Property<DateTime>("From")
                        .HasColumnType("smalldatetime");

                    b.Property<string>("Notes")
                        .HasMaxLength(1000)
                        .HasColumnType("nvarchar(1000)");

                    b.Property<Guid>("PersonId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<DateTime>("Until")
                        .HasColumnType("smalldatetime");

                    b.HasKey("Id");

                    b.HasIndex("From");

                    b.HasIndex("PersonId");

                    b.ToTable("WorkingEntry");
                });

            modelBuilder.Entity("Andaha.Services.Work.Core.WorkingEntry", b =>
                {
                    b.HasOne("Andaha.Services.Work.Core.Person", "Person")
                        .WithMany("WorkingEntries")
                        .HasForeignKey("PersonId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.Navigation("Person");
                });

            modelBuilder.Entity("Andaha.Services.Work.Core.Person", b =>
                {
                    b.Navigation("WorkingEntries");
                });
#pragma warning restore 612, 618
        }
    }
}
