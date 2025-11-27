using BarberBot.Application.Common.Interfaces;
using BarberBot.Domain.Entities;
using BarberBot.WebApi.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Moq;
using System.Linq.Expressions;
using Xunit;

namespace BarberBot.WebApi.UnitTests;

public class AppointmentsControllerTests
{
    private readonly Mock<IApplicationDbContext> _mockContext;
    private readonly AppointmentsController _controller;

    public AppointmentsControllerTests()
    {
        _mockContext = new Mock<IApplicationDbContext>();
        _controller = new AppointmentsController(_mockContext.Object);
    }

    [Fact]
    public async Task Create_ShouldReturnBadRequest_WhenAppointmentOverlaps()
    {
        // Arrange
        var barberId = 1;
        var existingStartTime = new DateTime(2023, 11, 20, 10, 0, 0);
        var existingEndTime = new DateTime(2023, 11, 20, 11, 0, 0);

        var existingAppointment = new Appointment
        {
            Id = 1,
            BarberId = barberId,
            StartTime = existingStartTime,
            EndTime = existingEndTime
        };

        var appointments = new List<Appointment> { existingAppointment };
        var mockAppointments = CreateMockDbSet(appointments);

        _mockContext.Setup(c => c.Appointments).Returns(mockAppointments.Object);

        var request = new CreateAppointmentRequest
        {
            BarberId = barberId,
            StartTime = new DateTime(2023, 11, 20, 10, 30, 0), // Overlaps
            EndTime = new DateTime(2023, 11, 20, 11, 30, 0),
            CustomerId = 1,
            ServiceId = 1
        };

        // Act
        var result = await _controller.Create(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>()
            .Which.Value.Should().Be("Seçilen berberin bu saat aralığında başka bir randevusu bulunmaktadır.");
    }

    [Fact]
    public async Task Create_ShouldCreateAppointment_WhenNoOverlap()
    {
        // Arrange
        var barberId = 1;
        var existingStartTime = new DateTime(2023, 11, 20, 10, 0, 0);
        var existingEndTime = new DateTime(2023, 11, 20, 11, 0, 0);

        var existingAppointment = new Appointment
        {
            Id = 1,
            BarberId = barberId,
            StartTime = existingStartTime,
            EndTime = existingEndTime
        };

        var appointments = new List<Appointment> { existingAppointment };
        var mockAppointments = CreateMockDbSet(appointments);

        _mockContext.Setup(c => c.Appointments).Returns(mockAppointments.Object);

        var request = new CreateAppointmentRequest
        {
            BarberId = barberId,
            StartTime = new DateTime(2023, 11, 20, 11, 0, 0), // No overlap (starts when previous ends)
            EndTime = new DateTime(2023, 11, 20, 12, 0, 0),
            CustomerId = 1,
            ServiceId = 1
        };

        // Act
        var result = await _controller.Create(request);

        // Assert
        result.Should().BeOfType<CreatedAtActionResult>();
        _mockContext.Verify(c => c.Appointments.Add(It.IsAny<Appointment>()), Times.Once);
        _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    // Helper to create Mock DbSet
    private static Mock<DbSet<T>> CreateMockDbSet<T>(List<T> elements) where T : class
    {
        var queryable = elements.AsQueryable();
        var mockSet = new Mock<DbSet<T>>();
        
        mockSet.As<IQueryable<T>>().Setup(m => m.Provider).Returns(new TestAsyncQueryProvider<T>(queryable.Provider));
        mockSet.As<IQueryable<T>>().Setup(m => m.Expression).Returns(queryable.Expression);
        mockSet.As<IQueryable<T>>().Setup(m => m.ElementType).Returns(queryable.ElementType);
        mockSet.As<IQueryable<T>>().Setup(m => m.GetEnumerator()).Returns(queryable.GetEnumerator());
        
        mockSet.As<IAsyncEnumerable<T>>().Setup(m => m.GetAsyncEnumerator(It.IsAny<CancellationToken>()))
            .Returns(new TestAsyncEnumerator<T>(queryable.GetEnumerator()));
        
        return mockSet;
    }
}

// Async Query Provider Helpers
internal class TestAsyncQueryProvider<TEntity> : IAsyncQueryProvider
{
    private readonly IQueryProvider _inner;

    internal TestAsyncQueryProvider(IQueryProvider inner)
    {
        _inner = inner;
    }

    public IQueryable CreateQuery(Expression expression)
    {
        return new TestAsyncEnumerable<TEntity>(expression);
    }

    public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
    {
        return new TestAsyncEnumerable<TElement>(expression);
    }

    public object Execute(Expression expression)
    {
        return _inner.Execute(expression);
    }

    public TResult Execute<TResult>(Expression expression)
    {
        return _inner.Execute<TResult>(expression);
    }

    public TResult ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken = default)
    {
        var resultType = typeof(TResult).GetGenericArguments()[0];
        var executionResult = typeof(IQueryProvider)
            .GetMethod(
                name: nameof(IQueryProvider.Execute),
                genericParameterCount: 1,
                types: new[] { typeof(Expression) })
            .MakeGenericMethod(resultType)
            .Invoke(this, new[] { expression });

        return (TResult)typeof(Task).GetMethod(nameof(Task.FromResult))
            .MakeGenericMethod(resultType)
            .Invoke(null, new[] { executionResult });
    }
}

internal class TestAsyncEnumerable<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
{
    public TestAsyncEnumerable(IEnumerable<T> enumerable)
        : base(enumerable)
    { }

    public TestAsyncEnumerable(Expression expression)
        : base(expression)
    { }

    public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default)
    {
        return new TestAsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());
    }

    IQueryProvider IQueryable.Provider
    {
        get { return new TestAsyncQueryProvider<T>(this); }
    }
}

internal class TestAsyncEnumerator<T> : IAsyncEnumerator<T>
{
    private readonly IEnumerator<T> _inner;

    public TestAsyncEnumerator(IEnumerator<T> inner)
    {
        _inner = inner;
    }

    public T Current
    {
        get
        {
            return _inner.Current;
        }
    }

    public ValueTask<bool> MoveNextAsync()
    {
        return new ValueTask<bool>(_inner.MoveNext());
    }

    public ValueTask DisposeAsync()
    {
        _inner.Dispose();
        return ValueTask.CompletedTask;
    }
}
