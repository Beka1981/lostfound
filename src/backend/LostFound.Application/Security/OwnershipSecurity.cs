using System.Security.Cryptography;
using System.Text;

namespace LostFound.Application.Security;
public static class OwnershipSecurity
{
 public static string GenerateSixDigitCode()=>RandomNumberGenerator.GetInt32(0,1_000_000).ToString("D6");
 public static string GenerateToken()=>Base64Url(RandomNumberGenerator.GetBytes(32));
 public static string GenerateSalt()=>Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
 public static string HashExchangeCode(string code,string salt,string secret){using var h=new HMACSHA256(Encoding.UTF8.GetBytes(secret));return Convert.ToBase64String(h.ComputeHash(Encoding.UTF8.GetBytes($"{salt}:{code}")));}
 public static bool VerifyExchangeCode(string code,string salt,string secret,string expected){var actual=Convert.FromBase64String(HashExchangeCode(code,salt,secret));var stored=Convert.FromBase64String(expected);return CryptographicOperations.FixedTimeEquals(actual,stored);}
 public static string HashQrToken(string token)=>Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
 public static bool VerifyQrToken(string token,string expectedHash){var actual=Encoding.ASCII.GetBytes(HashQrToken(token));var expected=Encoding.ASCII.GetBytes(expectedHash);return CryptographicOperations.FixedTimeEquals(actual,expected);}
 private static string Base64Url(byte[] bytes)=>Convert.ToBase64String(bytes).TrimEnd('=').Replace('+','-').Replace('/','_');
}
