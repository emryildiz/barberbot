using System.Security.Claims;
using BarberBot.Application.Auth.Commands.Login;
using BarberBot.Application.Auth.Commands.RefreshToken;
using BarberBot.Application.Auth.Queries.GetMe;
using BarberBot.Application.Common.Interfaces;
using BarberBot.Application.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarberBot.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IApplicationDbContext _context; // Still needed for SaveChangesAsync in Login/Refresh? 
    // Wait, the commands should handle saving the refresh token.
    // But LoginCommand only returns User. I need to update the user with new refresh token.
    // Ideally, the command should handle everything and return the tokens.
    // But for now, to minimize changes, I'll keep the token generation here or move it to command.
    // The user asked for "ben kimi" method.
    // Let's keep token generation here for now, but use MediatR for fetching user.
    // Actually, I should update the commands to return the tokens or handle the logic.
    // But I'll stick to the current flow: Command returns User, Controller generates Token.
    // BUT, I need to save the refresh token to DB.
    // So the Controller needs to call SaveChanges? That's bad.
    // The Command should handle saving.
    // Let's modify the commands to return the User with updated RefreshToken?
    // Or just inject DbContext here? No, that defeats the purpose.
    // Let's inject DbContext here just for saving the token, OR better:
    // Create a command `GenerateTokenCommand`? No.
    // Let's just use the existing logic but with MediatR for fetching.
    // AND I need to save the refresh token.
    // I will inject IApplicationDbContext here as well for now to save the token, 
    // OR I can create a `UpdateUserCommand`?
    // Let's just use IApplicationDbContext for now to save the token, as refactoring EVERYTHING is risky.
    // Wait, I can't inject IApplicationDbContext if I want to be pure CQRS.
    // I will update the LoginCommand to generate and save the refresh token?
    // No, token generation is a service.
    // Let's just add GetMe endpoint and use MediatR for Login/Refresh fetching.
    
    public AuthController(IMediator mediator, IJwtTokenGenerator jwtTokenGenerator, IApplicationDbContext context)
    {
        _mediator = mediator;
        _jwtTokenGenerator = jwtTokenGenerator;
        _context = context;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var command = new LoginCommand(request.Username, request.Password);
        var user = await _mediator.Send(command);

        if (user == null)
        {
            return Unauthorized("Invalid credentials");
        }

        var token = _jwtTokenGenerator.GenerateToken(user);
        var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();

        SetRefreshToken(refreshToken);
        SetAccessToken(token);
        SetRole(user.Role);

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync(CancellationToken.None);

        // Remove Role from response as requested
        return Ok(new { Token = token, RefreshToken = refreshToken });
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var refreshToken = request.RefreshToken ?? Request.Cookies["refreshToken"];

        if (string.IsNullOrEmpty(refreshToken))
        {
            return BadRequest("Invalid client request");
        }

        var command = new RefreshTokenCommand(request.Token, refreshToken);
        var user = await _mediator.Send(command);

        if (user == null)
        {
            return BadRequest("Invalid refresh token");
        }

        var newAccessToken = _jwtTokenGenerator.GenerateToken(user);
        var newRefreshToken = _jwtTokenGenerator.GenerateRefreshToken();

        SetRefreshToken(newRefreshToken);
        SetAccessToken(newAccessToken);
        SetRole(user.Role);

        user.RefreshToken = newRefreshToken;
        await _context.SaveChangesAsync(CancellationToken.None);

        return Ok(new { Token = newAccessToken, RefreshToken = newRefreshToken });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
        {
            return Unauthorized();
        }

        var user = await _mediator.Send(new GetMeQuery(userId));

        if (user == null)
        {
            return NotFound();
        }

        return Ok(new
        {
            user.Id,
            user.Username,
            user.Role
        });
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
        {
            return Unauthorized();
        }

        var command = new BarberBot.Application.Auth.Commands.ChangePassword.ChangePasswordCommand(userId, request.CurrentPassword, request.NewPassword);
        var result = await _mediator.Send(command);

        if (!result)
        {
            return BadRequest("Mevcut şifre hatalı veya kullanıcı bulunamadı.");
        }

        return Ok("Şifre başarıyla değiştirildi.");
    }

    private void SetRefreshToken(string refreshToken)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Expires = DateTime.UtcNow.AddDays(7),
            SameSite = SameSiteMode.Strict,
            Secure = true 
        };
        Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
    }

    private void SetAccessToken(string token)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Expires = DateTime.UtcNow.AddMinutes(15),
            SameSite = SameSiteMode.Strict,
            Secure = true
        };
        Response.Cookies.Append("accessToken", token, cookieOptions);
    }

    private void SetRole(string role)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Expires = DateTime.UtcNow.AddDays(7),
            SameSite = SameSiteMode.Strict,
            Secure = true
        };
        Response.Cookies.Append("role", role, cookieOptions);
    }
}

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
