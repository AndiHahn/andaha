# andaha

This project shows a project with a microservice architecture

Technologystack:  
- ASP .NET Core Web API
- Azure SQL Database
- Azure Container Apps
- Ocelot/Envoy Gateway
- Dapr  
- Angular
- Azure Static Webapp

## Run Project  
### Local docker environment  
1. Ensure docker desktop is installed  
2. Navigate to project root path and run command: ``` docker-compose up ```  
3. Open browser with url http://localhost:4200 or Status app with url http://localhost:XXXX   
4. Shut down docker with STRG+C  

### Local docker environment with Visual Studio in Debug mode 
1. Select Docker-Compose as startup project
2. Run project
3. Open browser with url http://localhost:4200 or Status app with url http://localhost:XXXX  

## Application Architecture

Overview of the application architecture:  

![Picture application architecture](https://github.com/AndiHahn/andaha/blob/master/doc/architecture.PNG)


## Infrastructure as code 

to be done...