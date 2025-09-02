# ConverText: Text Conversion Flow Summary

## Landing Page to First Step Flow

### 1. **Landing Page Entry** (`app/page.tsx`)
**Location**: `app/page.tsx:454-758` (Landing view when `showWorkflow = false`)

- **Hero Section**: Features a prominent conversion form with:
  - Task description input field (line 492-498)
  - Text content textarea (line 526-533)
  - "Convert" button (line 499-522)
- **Example Tiles**: 8 pre-configured examples organized by categories (CSV, Text, Format, Data) (line 545-577)
- **Features & Use Cases**: Marketing sections explaining capabilities

### 2. **Conversion Initiation**
**Location**: `app/page.tsx:57-64` (`handleTryNow` function)

When user clicks "Convert" or selects an example:
```typescript
const handleTryNow = () => {
  if (!taskDescription.trim() || !text.trim()) return;
  setShowWorkflow(true); // Switch to workflow view
  setTimeout(() => {
    handleSubmit(taskDescription, text); // Execute conversion
  }, 100);
};
```

### 3. **Authentication Check**
**Location**: `app/page.tsx:151-171` (`handleSubmit` function)

- **Unauthenticated Users**: 
  - Conversion data stored in `sessionStorage` as `pendingConversion`
  - Login dialog shown (`showLoginDialog = true`)
  - After authentication, conversion automatically retries (line 357-431)
- **Authenticated Users**: Proceed directly to step 4

### 4. **Workflow Timeline Interface**
**Location**: `app/page.tsx:762-835` (Workflow view when `showWorkflow = true`)

The interface switches to show:
- **Topbar**: User profile and navigation (`src/components/Topbar.tsx`)
- **WorkflowTimeline**: Main conversion interface (`src/components/WorkflowTimeline.tsx`)
- **Error Display**: If conversion fails
- **WorkflowLibrary**: For managing saved routines

## First Step Execution Flow

### 5. **Step Creation**
**Location**: `app/page.tsx:175-187`

A new `WorkflowStep` is created:
```typescript
const newStep: Omit<WorkflowStep, 'id' | 'timestamp' | 'stepNumber'> = {
  status: 'running',
  input: {
    text,
    taskDescription,
    exampleOutput
  }
};
```

### 6. **Backend Processing Pipeline**
**Location**: `app/page.tsx:192-235`

Two parallel API calls are made:

#### 6.1 **Tool Evaluation** (`/api/evaluate-with-history`)
- Analyzes the task and selects appropriate conversion tool
- Returns `ToolEvaluation` with reasoning, tool name, and arguments

#### 6.2 **Text Conversion** (`/api/convert-with-history`)
- **Location**: `app/api/convert-with-history/route.ts`
- Uses internal `ConversionAgent` (line 62-69)
- Processes text using selected LLM provider (Mock, OpenAI, or Gemini)
- Saves conversion history to Supabase (line 112-117)
- Returns `TextConversionResponse` with original/converted text and diff

### 7. **Step Completion**
**Location**: `app/page.tsx:236-250`

Step status updated to 'completed' with:
- Conversion results
- Tool evaluation data  
- Execution duration
- Error handling if conversion fails

### 8. **UI Display**
**Location**: `src/components/WorkflowStep.tsx`

Each completed step shows:
- **Status indicator**: Color-coded icon (line 64-68)
- **Task description**: User's original request (line 144-146)
- **Input text**: Original text in editable textarea (line 148-157)
- **Result section**: Converted text with tool used badge (line 172-188)
- **Action buttons**: "Add new step" and "Copy result" (line 203-225)

## Adding New Steps Process

### 9. **New Step Trigger**
**Location**: `src/components/WorkflowStep.tsx:49-53`

User clicks "Add new step" button:
```typescript
const handleAddNewStep = () => {
  if (step.output?.result.converted_text && onAddNewStep) {
    onAddNewStep(step.output.result.converted_text);
  }
};
```

### 10. **Step Addition Logic**
**Location**: `app/page.tsx:313-337`

For **authenticated users**:
- Current routine stored in `sessionStorage` as `routineInProgress`
- Redirects to `/routines/create` page for multi-step workflow building

For **unauthenticated users**:
- Routine stored in `sessionStorage` as `pendingRoutineCreation`
- Login dialog shown
- After auth, redirects to routine creation page

### 11. **Routine Creation Page**
**Location**: `app/routines/create/page.tsx`

- **Authentication Required**: Redirects non-authenticated users (line 79-84)
- **Session Restoration**: Loads in-progress routine from `sessionStorage` (line 30-63)
- **New Step Creation**: Creates step with 'editing' status (line 40-54)
- **Same Processing Pipeline**: Uses identical API calls and workflow management

## Key Components and Their Locations

| Component | File Location | Purpose |
|-----------|---------------|---------|
| **Landing Page** | `app/page.tsx` | Entry point, conversion form, examples |
| **WorkflowTimeline** | `src/components/WorkflowTimeline.tsx` | Main workflow interface, step management |
| **WorkflowStep** | `src/components/WorkflowStep.tsx` | Individual step display and actions |
| **Conversion API** | `app/api/convert-with-history/route.ts` | Backend processing with Supabase integration |
| **Evaluation API** | `app/api/evaluate-with-history/route.ts` | Tool selection and reasoning |
| **Routine Creation** | `app/routines/create/page.tsx` | Multi-step workflow builder |
| **Auth Provider** | `src/components/AuthProvider.tsx` | Authentication state management |
| **Workflow Utils** | `src/utils/workflow-supabase.ts` | Supabase-backed workflow operations |

## Data Flow Architecture

```
Landing Form → Authentication Check → Step Creation → 
API Processing (Evaluate + Convert) → Step Update → 
UI Display → Add New Step → Routine Creation Page
```

The system seamlessly handles both single-step conversions on the landing page and multi-step routine building, with full Supabase integration for persistence and user session management.