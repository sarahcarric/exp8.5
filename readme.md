# Exploration 8.5 Code: SpeedScore API Test Suites
This repository demonstrates best practices for constructing test suites for a back-end web API. We focus in Exploration 8.5 on the routes for creating a new user account. Our testing approach includes both integration and unit tests. The `main` branch contains the code for the SpeedScore back-end app without tests. The `tests/register-user` branch includes the code developed in Exploration 8.5.

This test suite adheres to many of the best practices, as it does utilize a structure-first organization, allowing easy access to running all tests of a particular type.  However, a feature-first approach is not apparent.  Implementing a feature-first approach would make it so that the feature-based code reviews and coverage assessments are easily conducted.  Regarding setup and teardown, the integration tests use beforeAll, beforeEach, afterAll, and afterEach to manage database state and test data, adhering to best practices to use shared setup/teardown for persistent infrastructure, to ensure a clean environment for each test. For the testing strategies, the test suite adheres to best practices by focusing on core business logic, error handling, integration points, and security.  Regarding configurability, the tests use environment variables, which support the tests running in different environments with different configurations.  Lastly, regarding maintainability, the tests clean up after themselves.  However, the tests do lack documentation and have no clear guidance on how to run the tests. 
Addressing the effectiveness in testing registration functionality,  the test suites effectively cover both the successful registration and verification, as well as a wide range of error conditions.  Realistic data is used and simulate actually HTTP requests, which leads to increased confidence in system behavior. Required fields are checked to make sure the user entered something, and error messages are validated.  It should be noted that maximum field lengths and external services failures are neglected to be tested in this suite.  
For proposed improvements, I would recommend a feature-first organization, which would involve the tests being reorganized by feature.  I recommend this because it would make it easier to asses feature coverage.  I would also recommend expanding negative and boundary testing.  This would involve adding tests for maximum-minimum field lengths and special characters, and simulated failures of external dependencies.  To add to that, I would add more documentation on how to run and debug tests, as well as add comments to complex tests. Lastly, I would ensure test configuration was separated from the test logic and easily adjustable for different environments.  



The names of the new tests are:
"should handle database transaction failures during registration"
"should handle email service failures gracefully"
"should handle JWT token verification failures"
"should handle rate limiting scenarios"
"should handle multiple concurrent registration attempts"
"should hash a maximum length (100 chars) password"
"should hash a minimum length (8 chars) password"
"should reject a password missing uppercase letters"
"should allow valid emails with special characters"
"should allow unicode characters in email if supported"
