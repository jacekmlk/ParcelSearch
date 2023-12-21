int bytesRead = 0;
System.IO.Stream stream = client_.GetStream();
byte[] buffer = new byte[k_BUFFER_BYTES];  
while(true)
{
    Task.Delay(100);
    if (client_.Available > 0) // Available contains the available bytes
    {
        int counter = 0;
        string output = "";

        while (counter < client_.Available)
        {
            bytesRead = stream.Read(buffer, 0, k_BUFFER_BYTES);
            counter += bytesRead ;

            output += System.Text.Encoding.ASCII.GetString(buffer, 0, bytesRead);
        }
        await stream.WriteAsync(Encoding.ASCII.GetBytes("cfm\n"), 0, 4);   
        await stream.FlushAsync();

        Console.WriteLine(output + " - " + counter + " - " + client_.Available);
    }
}