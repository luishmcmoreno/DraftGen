# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (Next.js)
- `cd frontend && npm run dev` - Start development server
- `cd frontend && npm run build` - Build for production
- `cd frontend && npm run lint` - Run ESLint

### Backend (FastAPI)
- `cd backend && python -m uvicorn main:app --reload` - Start backend server
- `cd backend && python test_tools.py` - Run basic tool tests

## Project Architecture

### High-Level Structure
This is an AI-powered text conversion system with three main components:

1. **Frontend** (`/frontend`): Next.js/React application using TypeScript and Tailwind CSS
2. **Backend** (`/backend`): FastAPI server with agent system and text manipulation tools
3. **Agent System**: LLM-powered conversion agents with deterministic tools

### Core Components

#### Backend Agent System (`/backend/agent/`)
- `conversion_agent.py` - Main agent that processes text conversion requests
- `providers.py` - LLM provider abstractions (OpenAI, Gemini, Mock)
- Agent uses custom prompt template and output parser to select appropriate tools

#### Text Tools (`/backend/tools/`)
- `text_tools.py` - Deterministic text manipulation utilities
- Tools include uppercase/lowercase, deduplication, word/line counting, CSV to JSON conversion
- Tools are dynamically exposed to the agent system

#### Frontend Architecture (`/frontend/src/`)
- **Workflow-based system** (not conversation-based)
- `types/conversion.ts` - Core TypeScript interfaces for workflows, steps, and conversions
- `utils/workflow.ts` - Workflow management utilities
- Components support multi-step conversion routines with step-by-step execution

### Key Concepts

#### Workflow vs Conversation
The system transitioned from conversation-based to workflow-based management:
- **WorkflowStep**: Individual conversion steps with status tracking
- **ConversionRoutineExecution**: Multi-step workflow execution
- **SavedConversionRoutine**: Reusable workflow templates

#### Provider System
Backend supports multiple LLM providers:
- **OpenAI**: Via `OPENAI_API_KEY` environment variable
- **Gemini**: Via Google Generative AI
- **Mock**: For development/testing
- Provider selection via `LLM_PROVIDER` environment variable or `X-LLM-Provider` header

#### Agent Tool Selection
The conversion agent:
1. Receives text and task description
2. Uses LLM to evaluate which tool to use
3. Executes the selected tool with parsed arguments
4. Returns results with diff visualization

## Environment Variables

Backend requires:
- `LLM_PROVIDER` - "openai", "gemini", or "mock" 
- `OPENAI_API_KEY` - OpenAI API key (if using OpenAI)
- `OPENAI_MODEL` - Model name (default: "gpt-4o-mini")
- `OPENAI_TEMPERATURE` - Temperature setting (default: 0.7)

## API Architecture

Main endpoints:
- `POST /convert` - Execute text conversion
- `POST /evaluate` - Evaluate task and suggest tools
- `GET /tool_signatures` - Get available tool signatures

Frontend communicates with backend via these endpoints, supporting provider override through headers.