# Architecture Notes

## Request Flow

1. Student or admin interacts with the React frontend.
2. Frontend calls Express REST APIs.
3. Express stores and retrieves app data from MongoDB.
4. Express calls the FastAPI service for resume parsing, scoring, roadmap generation, and interview support.
5. Results are aggregated back into student and admin dashboards.

## Key Design Choices

- JWT authentication with role-based route guards
- Separate AI service to match the proposed architecture
- Seeded companies and roles to ensure the demo works immediately
- Resume analysis that combines extracted text, skill dictionaries, and scoring heuristics

