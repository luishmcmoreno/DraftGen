import { BaseAIProvider } from './base';
import { GenerateTemplateRequest, GenerateTemplateResponse } from '../types';

export class MockProvider extends BaseAIProvider {
  async generateTemplate(request: GenerateTemplateRequest): Promise<GenerateTemplateResponse> {
    const prompt = request.prompt.toLowerCase();
    const existingJson = request.existingJson;

    // If updating existing template
    if (existingJson && existingJson.children) {
      const baseChildren = [...existingJson.children];
      
      if (prompt.includes('add') || prompt.includes('include')) {
        if (prompt.includes('confidential')) {
          baseChildren.push({
            type: 'text',
            content: 'CONFIDENTIALITY: This document contains confidential information and must not be shared with third parties.'
          });
        } else if (prompt.includes('signature')) {
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
      
      return this.validateResponse({
        type: 'document',
        children: baseChildren
      });
    }

    // Generate new templates based on keywords
    let template;
    
    if (prompt.includes('employment') || prompt.includes('contract')) {
      template = {
        type: 'document',
        children: [
          { 
            type: 'heading',
            level: 1,
            content: 'EMPLOYMENT CONTRACT',
            styles: { alignment: 'center' }
          },
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
    } else if (prompt.includes('invoice')) {
      template = {
        type: 'document',
        children: [
          { 
            type: 'heading',
            level: 1,
            content: 'INVOICE #${INVOICE_NUMBER}',
            styles: { alignment: 'center' }
          },
          { type: 'text', content: '' },
          {
            type: 'grid',
            columns: 2,
            children: [
              {
                type: 'column',
                children: [
                  { type: 'text', content: '**From:**\n${VENDOR_NAME}\n${VENDOR_ADDRESS}' }
                ]
              },
              {
                type: 'column',
                children: [
                  { type: 'text', content: '**To:**\n${CLIENT_NAME}\n${CLIENT_ADDRESS}' }
                ]
              }
            ]
          },
          { type: 'text', content: '' },
          { type: 'text', content: 'Date: ${INVOICE_DATE}' },
          { type: 'text', content: 'Due Date: ${DUE_DATE}' },
          { type: 'text', content: '' },
          {
            type: 'table',
            head: {
              type: 'table-head',
              children: [
                {
                  type: 'table-column',
                  children: [{ type: 'text', content: 'Description' }]
                },
                {
                  type: 'table-column',
                  children: [{ type: 'text', content: 'Quantity' }]
                },
                {
                  type: 'table-column',
                  children: [{ type: 'text', content: 'Unit Price' }]
                },
                {
                  type: 'table-column',
                  children: [{ type: 'text', content: 'Total' }]
                }
              ]
            },
            children: [
              {
                type: 'table-row',
                children: [
                  {
                    type: 'table-column',
                    children: [{ type: 'text', content: '${SERVICE_DESCRIPTION}' }]
                  },
                  {
                    type: 'table-column',
                    children: [{ type: 'text', content: '${QUANTITY}' }]
                  },
                  {
                    type: 'table-column',
                    children: [{ type: 'text', content: '${UNIT_PRICE}' }]
                  },
                  {
                    type: 'table-column',
                    children: [{ type: 'text', content: '${TOTAL}' }]
                  }
                ]
              }
            ]
          },
          { type: 'text', content: '' },
          { type: 'text', content: 'Subtotal: ${SUBTOTAL}' },
          { type: 'text', content: 'Tax: ${TAX}' },
          { type: 'text', content: 'Total Amount: ${AMOUNT}' },
          { type: 'text', content: '' },
          { type: 'text', content: 'Payment Terms: ${PAYMENT_TERMS}' }
        ]
      };
    } else if (prompt.includes('service') || prompt.includes('agreement')) {
      template = {
        type: 'document',
        children: [
          { 
            type: 'heading',
            level: 1,
            content: 'SERVICE AGREEMENT',
            styles: { alignment: 'center' }
          },
          { type: 'text', content: '' },
          { type: 'text', content: 'This Service Agreement is made on **${AGREEMENT_DATE}**' },
          { type: 'text', content: 'Between: ${CLIENT_NAME} ("Client")' },
          { type: 'text', content: 'And: ${PROVIDER_NAME} ("Service Provider")' },
          { type: 'text', content: '' },
          { 
            type: 'heading',
            level: 2,
            content: '1. SERVICES'
          },
          { type: 'text', content: 'The Service Provider agrees to provide the following services:' },
          {
            type: 'list',
            ordered: false,
            children: [
              {
                type: 'list-item',
                children: [{ type: 'text', content: '${SERVICE_1}' }]
              },
              {
                type: 'list-item',
                children: [{ type: 'text', content: '${SERVICE_2}' }]
              },
              {
                type: 'list-item',
                children: [{ type: 'text', content: '${SERVICE_3}' }]
              }
            ]
          },
          { type: 'text', content: '' },
          { 
            type: 'heading',
            level: 2,
            content: '2. DELIVERABLES'
          },
          {
            type: 'list',
            ordered: true,
            children: [
              {
                type: 'list-item',
                children: [{ type: 'text', content: '${DELIVERABLE_1}' }]
              },
              {
                type: 'list-item',
                children: [{ type: 'text', content: '${DELIVERABLE_2}' }]
              }
            ]
          },
          { type: 'text', content: '' },
          { 
            type: 'heading',
            level: 2,
            content: '3. PAYMENT TERMS'
          },
          { type: 'text', content: 'Total Fee: ${TOTAL_FEE}' },
          { type: 'text', content: 'Payment Schedule: ${PAYMENT_SCHEDULE}' }
        ]
      };
    } else if (prompt.includes('letter')) {
      template = {
        type: 'document',
        children: [
          { type: 'text', content: '${SENDER_NAME}\n${SENDER_ADDRESS}\n${DATE}' },
          { type: 'text', content: 'Dear ${RECIPIENT_NAME},' },
          { type: 'text', content: '${LETTER_BODY}' },
          { type: 'text', content: 'Sincerely,\n\n${SENDER_NAME}' }
        ]
      };
    } else {
      // Default template
      template = {
        type: 'document',
        children: [
          { type: 'text', content: 'Document Title: ${TITLE}' },
          { type: 'text', content: 'Date: ${DATE}' },
          { type: 'text', content: 'Content: ${CONTENT}' }
        ]
      };
    }

    return this.validateResponse(template);
  }
}