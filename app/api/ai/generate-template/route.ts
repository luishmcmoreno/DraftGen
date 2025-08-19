import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAIProvider, AIError } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { prompt, existingJson } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid prompt' },
        { status: 400 }
      );
    }

    // Get AI provider and generate template
    const provider = getAIProvider();
    const result = await provider.generateTemplate({
      prompt,
      existingJson
    });

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error generating template:', error);
    
    // Handle specific AI errors
    if (error instanceof AIError) {
      if (error.code === 'RATE_LIMIT') {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      if (error.code === 'INVALID_RESPONSE') {
        return NextResponse.json(
          { error: 'Failed to generate valid template. Please try again.' },
          { status: 422 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}

// Keep mock function for reference (not used anymore)
function generateMockTemplate(prompt: string, existingJson?: any): any {
  const promptLower = prompt.toLowerCase();

  // If updating existing template
  if (existingJson && existingJson.children) {
    const baseChildren = [...existingJson.children];
    
    if (promptLower.includes('add') || promptLower.includes('include')) {
      // Add new content
      if (promptLower.includes('confidential')) {
        baseChildren.push({
          type: 'text',
          content: 'CONFIDENTIALITY: This document contains confidential information and must not be shared with third parties.'
        });
      } else if (promptLower.includes('signature')) {
        baseChildren.push(
          { type: 'text', content: 'Signature: _____________________' },
          { type: 'text', content: 'Date: ${SIGNATURE_DATE}' }
        );
      } else {
        baseChildren.push({
          type: 'text',
          content: 'Additional content based on your request'
        });
      }
    }
    
    return {
      type: 'document',
      children: baseChildren
    };
  }

  // Generate new templates based on keywords
  if (promptLower.includes('employment') || promptLower.includes('contract')) {
    return {
      type: 'document',
      children: [
        { type: 'text', content: 'EMPLOYMENT CONTRACT' },
        { type: 'text', content: 'This Employment Agreement is entered into as of ${START_DATE}' },
        { type: 'text', content: 'Between: ${COMPANY_NAME} ("Employer")' },
        { type: 'text', content: 'And: ${EMPLOYEE_NAME} ("Employee")' },
        { type: 'text', content: 'Position: ${POSITION}' },
        { type: 'text', content: 'Start Date: ${START_DATE}' },
        { type: 'text', content: 'Salary: ${SALARY} per annum' },
        { type: 'text', content: 'Working Hours: ${WORKING_HOURS}' },
        { type: 'text', content: 'Benefits: ${BENEFITS}' }
      ]
    };
  }

  if (promptLower.includes('invoice')) {
    return {
      type: 'document',
      children: [
        { type: 'text', content: 'INVOICE #${INVOICE_NUMBER}' },
        { type: 'text', content: 'Date: ${INVOICE_DATE}' },
        { type: 'text', content: 'From: ${VENDOR_NAME}' },
        { type: 'text', content: 'To: ${CLIENT_NAME}' },
        { type: 'text', content: 'Description: ${SERVICE_DESCRIPTION}' },
        { type: 'text', content: 'Amount: ${AMOUNT}' },
        { type: 'text', content: 'Due Date: ${DUE_DATE}' },
        { type: 'text', content: 'Payment Terms: ${PAYMENT_TERMS}' }
      ]
    };
  }

  if (promptLower.includes('letter')) {
    return {
      type: 'document',
      children: [
        { type: 'text', content: '${SENDER_NAME}' },
        { type: 'text', content: '${SENDER_ADDRESS}' },
        { type: 'text', content: '${DATE}' },
        { type: 'text', content: 'Dear ${RECIPIENT_NAME},' },
        { type: 'text', content: '${LETTER_BODY}' },
        { type: 'text', content: 'Sincerely,' },
        { type: 'text', content: '${SENDER_NAME}' }
      ]
    };
  }

  // Default template
  return {
    type: 'document',
    children: [
      { type: 'text', content: 'Document Title: ${TITLE}' },
      { type: 'text', content: 'Date: ${DATE}' },
      { type: 'text', content: 'Content: ${CONTENT}' }
    ]
  };
}