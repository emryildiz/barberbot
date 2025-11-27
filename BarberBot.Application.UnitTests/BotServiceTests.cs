using BarberBot.Application.Common.Interfaces;
using BarberBot.Application.Services;
using BarberBot.Domain.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Moq;
using System.Linq.Expressions;
using Xunit;

namespace BarberBot.Application.UnitTests;

public class BotServiceTests
{
    private readonly Mock<IWhatsAppService> _mockWhatsAppService;
    private readonly Mock<IApplicationDbContext> _mockContext;
    private readonly BotService _botService;

    public BotServiceTests()
    {
        _mockWhatsAppService = new Mock<IWhatsAppService>();
        _mockContext = new Mock<IApplicationDbContext>();
        _botService = new BotService(_mockWhatsAppService.Object, _mockContext.Object);
    }

    [Fact]
    public async Task ProcessIncomingMessageAsync_ShouldCreateCustomer_WhenCustomerDoesNotExist()
    {
        // Arrange
        var phoneNumber = "5551234567";
        var message = "Merhaba";
        var customers = new List<Customer>();
        var mockCustomers = CreateMockDbSet(customers);

        _mockContext.Setup(c => c.Customers).Returns(mockCustomers.Object);

        // Act
        await _botService.ProcessIncomingMessageAsync(phoneNumber, message);

        // Assert
        _mockContext.Verify(c => c.Customers.Add(It.Is<Customer>(c => c.PhoneNumber == phoneNumber)), Times.Once);
        _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.AtLeastOnce);
    }

    [Fact]
    public async Task ProcessIncomingMessageAsync_ShouldAskForName_WhenCustomerIsGuest()
    {
        // Arrange
        var phoneNumber = "5551234567";
        var message = "Merhaba";
        var customer = new Customer { PhoneNumber = phoneNumber, Name = "Guest", CurrentState = "None" };
        var customers = new List<Customer> { customer };
        var mockCustomers = CreateMockDbSet(customers);

        _mockContext.Setup(c => c.Customers).Returns(mockCustomers.Object);

        // Act
        await _botService.ProcessIncomingMessageAsync(phoneNumber, message);

        // Assert
        customer.CurrentState.Should().Be("EnteringName");
        _mockWhatsAppService.Verify(w => w.SendMessageAsync(phoneNumber, "Merhaba! Size hitap edebilmemiz için lütfen adınızı soyadınızı yazar mısınız?"), Times.Once);
    }

    [Fact]
    public async Task ProcessIncomingMessageAsync_ShouldSaveName_WhenStateIsEnteringName()
    {
        // Arrange
        var phoneNumber = "5551234567";
        var message = "Ahmet Yılmaz";
        var customer = new Customer { PhoneNumber = phoneNumber, Name = "Guest", CurrentState = "EnteringName" };
        var customers = new List<Customer> { customer };
        var mockCustomers = CreateMockDbSet(customers);

        _mockContext.Setup(c => c.Customers).Returns(mockCustomers.Object);

        // Act
        await _botService.ProcessIncomingMessageAsync(phoneNumber, message);

        // Assert
        customer.Name.Should().Be("Ahmet Yılmaz");
        customer.CurrentState.Should().Be("None");
        _mockWhatsAppService.Verify(w => w.SendMessageAsync(phoneNumber, "Memnun oldum Ahmet Yılmaz! Randevu almak için 'Randevu' yazabilirsin."), Times.Once);
    }

    [Fact]
    public async Task ProcessIncomingMessageAsync_ShouldTransitionToSelectingService_WhenMessageIsRandevuAndNameIsSet()
    {
        // Arrange
        var phoneNumber = "5551234567";
        var message = "Randevu";
        var customer = new Customer { PhoneNumber = phoneNumber, Name = "Ahmet", CurrentState = "None" };
        var customers = new List<Customer> { customer };
        var mockCustomers = CreateMockDbSet(customers);
        
        var services = new List<Service> { new Service { Id = 1, Name = "Saç Kesimi", Price = 100 } };
        var mockServices = CreateMockDbSet(services);

        _mockContext.Setup(c => c.Customers).Returns(mockCustomers.Object);
        _mockContext.Setup(c => c.Services).Returns(mockServices.Object);

        // Act
        await _botService.ProcessIncomingMessageAsync(phoneNumber, message);

        // Assert
        customer.CurrentState.Should().Be("SelectingService");
        _mockWhatsAppService.Verify(w => w.SendMessageAsync(phoneNumber, It.Is<string>(s => s.Contains("Saç Kesimi"))), Times.Once);
        _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessIncomingMessageAsync_ShouldSelectToday_WhenMessageIsBugun()
    {
        // Arrange
        var phoneNumber = "5551234567";
        var message = "bugün";
        var customer = new Customer { PhoneNumber = phoneNumber, Name = "Ahmet", CurrentState = "SelectingDate", SelectedBarberId = 1 };
        var customers = new List<Customer> { customer };
        var mockCustomers = CreateMockDbSet(customers);

        _mockContext.Setup(c => c.Customers).Returns(mockCustomers.Object);

        // Act
        await _botService.ProcessIncomingMessageAsync(phoneNumber, message);

        // Assert
        customer.SelectedDate.Should().Be(DateTime.Today);
        customer.CurrentState.Should().Be("SelectingTime");
        _mockWhatsAppService.Verify(w => w.SendMessageAsync(phoneNumber, It.Is<string>(s => s.Contains(DateTime.Today.ToShortDateString()))), Times.Once);
    }

    [Fact]
    public async Task ProcessIncomingMessageAsync_ShouldSelectTomorrow_WhenMessageIsYarin()
    {
        // Arrange
        var phoneNumber = "5551234567";
        var message = "yarın";
        var customer = new Customer { PhoneNumber = phoneNumber, Name = "Ahmet", CurrentState = "SelectingDate", SelectedBarberId = 1 };
        var customers = new List<Customer> { customer };
        var mockCustomers = CreateMockDbSet(customers);

        _mockContext.Setup(c => c.Customers).Returns(mockCustomers.Object);

        // Act
        await _botService.ProcessIncomingMessageAsync(phoneNumber, message);

        // Assert
        customer.SelectedDate.Should().Be(DateTime.Today.AddDays(1));
        customer.CurrentState.Should().Be("SelectingTime");
        _mockWhatsAppService.Verify(w => w.SendMessageAsync(phoneNumber, It.Is<string>(s => s.Contains(DateTime.Today.AddDays(1).ToShortDateString()))), Times.Once);
    }

    [Fact]
    public async Task ProcessIncomingMessageAsync_ShouldSelectDate_WhenMessageIsDayMonthYearFormat()
    {
        // Arrange
        var phoneNumber = "5551234567";
        var message = "25.11.2023";
        var customer = new Customer { PhoneNumber = phoneNumber, Name = "Ahmet", CurrentState = "SelectingDate", SelectedBarberId = 1 };
        var customers = new List<Customer> { customer };
        var mockCustomers = CreateMockDbSet(customers);

        _mockContext.Setup(c => c.Customers).Returns(mockCustomers.Object);

        // Act
        await _botService.ProcessIncomingMessageAsync(phoneNumber, message);

        // Assert
        customer.SelectedDate.Should().Be(new DateTime(2023, 11, 25));
        customer.CurrentState.Should().Be("SelectingTime");
        _mockWhatsAppService.Verify(w => w.SendMessageAsync(phoneNumber, It.Is<string>(s => s.Contains("25.11.2023"))), Times.Once);
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

// Async Query Provider Helpers needed for Entity Framework Core async operations in tests
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
