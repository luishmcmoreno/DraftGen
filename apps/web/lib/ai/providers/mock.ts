import { BaseAIProvider } from './base';
import { GenerateTemplateRequest, GenerateTemplateResponse } from '../types';
import { NodeTypeEnum } from '@/lib/dslValidator';

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
            type: NodeTypeEnum.TEXT,
            content:
              'CONFIDENTIALITY: This document contains confidential information and must not be shared with third parties.',
          });
        } else if (prompt.includes('signature')) {
          baseChildren.push(
            { type: NodeTypeEnum.TEXT, content: 'Signature: _____________________' },
            { type: NodeTypeEnum.TEXT, content: 'Date: ${SIGNATURE_DATE}' }
          );
        } else {
          baseChildren.push({
            type: NodeTypeEnum.TEXT,
            content: 'Additional content based on your request',
          });
        }
      }

      return this.validateResponse({
        type: NodeTypeEnum.DOCUMENT,
        children: baseChildren,
      });
    }

    // Generate new templates based on keywords
    let template;

    if (prompt.includes('employment') || prompt.includes('contract')) {
      template = {
        type: NodeTypeEnum.DOCUMENT,
        children: [
          {
            type: NodeTypeEnum.HEADING,
            level: 1,
            content: 'EMPLOYMENT CONTRACT',
            styles: { alignment: 'center' },
          },
          {
            type: NodeTypeEnum.TEXT,
            content: 'This Employment Agreement is entered into as of ${START_DATE}',
          },
          { type: NodeTypeEnum.TEXT, content: 'Between: ${COMPANY_NAME} ("Employer")' },
          { type: NodeTypeEnum.TEXT, content: 'And: ${EMPLOYEE_NAME} ("Employee")' },
          { type: NodeTypeEnum.TEXT, content: 'Position: ${POSITION}' },
          { type: NodeTypeEnum.TEXT, content: 'Start Date: ${START_DATE}' },
          { type: NodeTypeEnum.TEXT, content: 'Salary: ${SALARY} per annum' },
          { type: NodeTypeEnum.TEXT, content: 'Working Hours: ${WORKING_HOURS}' },
          { type: NodeTypeEnum.TEXT, content: 'Benefits: ${BENEFITS}' },
        ],
      };
    } else if (prompt.includes('invoice')) {
      template = {
        type: NodeTypeEnum.DOCUMENT,
        children: [
          {
            type: NodeTypeEnum.HEADING,
            level: 1,
            content: 'INVOICE #${INVOICE_NUMBER}',
            styles: { alignment: 'center' },
          },
          { type: NodeTypeEnum.TEXT, content: '' },
          {
            type: NodeTypeEnum.GRID,
            columns: 2,
            children: [
              {
                type: NodeTypeEnum.COLUMN,
                children: [
                  { type: NodeTypeEnum.TEXT, content: '**From:**\n${VENDOR_NAME}\n${VENDOR_ADDRESS}' },
                ],
              },
              {
                type: NodeTypeEnum.COLUMN,
                children: [{ type: NodeTypeEnum.TEXT, content: '**To:**\n${CLIENT_NAME}\n${CLIENT_ADDRESS}' }],
              },
            ],
          },
          { type: NodeTypeEnum.TEXT, content: '' },
          { type: NodeTypeEnum.TEXT, content: 'Date: ${INVOICE_DATE}' },
          { type: NodeTypeEnum.TEXT, content: 'Due Date: ${DUE_DATE}' },
          { type: NodeTypeEnum.TEXT, content: '' },
          {
            type: NodeTypeEnum.TABLE,
            head: {
              type: NodeTypeEnum.TABLE_HEAD,
              children: [
                {
                  type: NodeTypeEnum.TABLE_COLUMN,
                  children: [{ type: NodeTypeEnum.TEXT, content: 'Description' }],
                },
                {
                  type: NodeTypeEnum.TABLE_COLUMN,
                  children: [{ type: NodeTypeEnum.TEXT, content: 'Quantity' }],
                },
                {
                  type: NodeTypeEnum.TABLE_COLUMN,
                  children: [{ type: NodeTypeEnum.TEXT, content: 'Unit Price' }],
                },
                {
                  type: NodeTypeEnum.TABLE_COLUMN,
                  children: [{ type: NodeTypeEnum.TEXT, content: 'Total' }],
                },
              ],
            },
            children: [
              {
                type: NodeTypeEnum.TABLE_ROW,
                children: [
                  {
                    type: NodeTypeEnum.TABLE_COLUMN,
                    children: [{ type: NodeTypeEnum.TEXT, content: '${SERVICE_DESCRIPTION}' }],
                  },
                  {
                    type: NodeTypeEnum.TABLE_COLUMN,
                    children: [{ type: NodeTypeEnum.TEXT, content: '${QUANTITY}' }],
                  },
                  {
                    type: NodeTypeEnum.TABLE_COLUMN,
                    children: [{ type: NodeTypeEnum.TEXT, content: '${UNIT_PRICE}' }],
                  },
                  {
                    type: NodeTypeEnum.TABLE_COLUMN,
                    children: [{ type: NodeTypeEnum.TEXT, content: '${TOTAL}' }],
                  },
                ],
              },
            ],
          },
          { type: NodeTypeEnum.TEXT, content: '' },
          { type: NodeTypeEnum.TEXT, content: 'Subtotal: ${SUBTOTAL}' },
          { type: NodeTypeEnum.TEXT, content: 'Tax: ${TAX}' },
          { type: NodeTypeEnum.TEXT, content: 'Total Amount: ${AMOUNT}' },
          { type: NodeTypeEnum.TEXT, content: '' },
          { type: NodeTypeEnum.TEXT, content: 'Payment Terms: ${PAYMENT_TERMS}' },
        ],
      };
    } else if (prompt.includes('service') || prompt.includes('agreement')) {
      template = {
        type: NodeTypeEnum.DOCUMENT,
        children: [
          {
            type: NodeTypeEnum.HEADING,
            level: 1,
            content: 'SERVICE AGREEMENT',
            styles: { alignment: 'center' },
          },
          { type: NodeTypeEnum.TEXT, content: '' },
          { type: NodeTypeEnum.TEXT, content: 'This Service Agreement is made on **${AGREEMENT_DATE}**' },
          { type: NodeTypeEnum.TEXT, content: 'Between: ${CLIENT_NAME} ("Client")' },
          { type: NodeTypeEnum.TEXT, content: 'And: ${PROVIDER_NAME} ("Service Provider")' },
          { type: NodeTypeEnum.TEXT, content: '' },
          {
            type: NodeTypeEnum.HEADING,
            level: 2,
            content: '1. SERVICES',
          },
          {
            type: NodeTypeEnum.TEXT,
            content: 'The Service Provider agrees to provide the following services:',
          },
          {
            type: NodeTypeEnum.LIST,
            ordered: false,
            children: [
              {
                type: NodeTypeEnum.LIST_ITEM,
                children: [{ type: NodeTypeEnum.TEXT, content: '${SERVICE_1}' }],
              },
              {
                type: NodeTypeEnum.LIST_ITEM,
                children: [{ type: NodeTypeEnum.TEXT, content: '${SERVICE_2}' }],
              },
              {
                type: NodeTypeEnum.LIST_ITEM,
                children: [{ type: NodeTypeEnum.TEXT, content: '${SERVICE_3}' }],
              },
            ],
          },
          { type: NodeTypeEnum.TEXT, content: '' },
          {
            type: NodeTypeEnum.HEADING,
            level: 2,
            content: '2. DELIVERABLES',
          },
          {
            type: NodeTypeEnum.LIST,
            ordered: true,
            children: [
              {
                type: NodeTypeEnum.LIST_ITEM,
                children: [{ type: NodeTypeEnum.TEXT, content: '${DELIVERABLE_1}' }],
              },
              {
                type: NodeTypeEnum.LIST_ITEM,
                children: [{ type: NodeTypeEnum.TEXT, content: '${DELIVERABLE_2}' }],
              },
            ],
          },
          { type: NodeTypeEnum.TEXT, content: '' },
          {
            type: NodeTypeEnum.HEADING,
            level: 2,
            content: '3. PAYMENT TERMS',
          },
          { type: NodeTypeEnum.TEXT, content: 'Total Fee: ${TOTAL_FEE}' },
          { type: NodeTypeEnum.TEXT, content: 'Payment Schedule: ${PAYMENT_SCHEDULE}' },
        ],
      };
    } else if (prompt.includes('letter')) {
      template = {
        type: NodeTypeEnum.DOCUMENT,
        children: [
          { type: NodeTypeEnum.TEXT, content: '${SENDER_NAME}\n${SENDER_ADDRESS}\n${DATE}' },
          { type: NodeTypeEnum.TEXT, content: 'Dear ${RECIPIENT_NAME},' },
          { type: NodeTypeEnum.TEXT, content: '${LETTER_BODY}' },
          { type: NodeTypeEnum.TEXT, content: 'Sincerely,\n\n${SENDER_NAME}' },
        ],
      };
    } else {
      // Default template
      template = {
        type: NodeTypeEnum.DOCUMENT,
        children: [
          { type: NodeTypeEnum.TEXT, content: 'Document Title: ${TITLE}' },
          { type: NodeTypeEnum.TEXT, content: 'Date: ${DATE}' },
          { type: NodeTypeEnum.TEXT, content: 'Content: ${CONTENT}' },
        ],
      };
    }

    return this.validateResponse(template);
  }
}
