const AWS = require('aws-sdk');

/**
 * AWS Textract Integration Service for OrPaynter
 * Provides document analysis capabilities for insurance claims and contracts
 */
class TextractService {
  constructor() {
    this.textract = new AWS.Textract({
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
  }

  /**
   * Detect text in a document
   * @param {Buffer|string} document - Document buffer or S3 object key
   * @param {boolean} isS3 - Whether the document is in S3
   * @param {string} bucketName - S3 bucket name (required if isS3 is true)
   * @returns {Promise<Object>} Detected text
   */
  async detectText(document, isS3 = false, bucketName = null) {
    try {
      let params;
      
      if (isS3) {
        if (!bucketName) {
          throw new Error('Bucket name is required for S3 documents');
        }
        
        params = {
          Document: {
            S3Object: {
              Bucket: bucketName,
              Name: document
            }
          }
        };
      } else {
        params = {
          Document: {
            Bytes: Buffer.isBuffer(document) ? document : Buffer.from(document, 'base64')
          }
        };
      }
      
      const result = await this.textract.detectDocumentText(params).promise();
      return this._formatTextDetectionResponse(result);
    } catch (error) {
      console.error('Error detecting text:', error);
      throw new Error(`Failed to detect text: ${error.message}`);
    }
  }

  /**
   * Analyze document for forms, tables, and text
   * @param {Buffer|string} document - Document buffer or S3 object key
   * @param {boolean} isS3 - Whether the document is in S3
   * @param {string} bucketName - S3 bucket name (required if isS3 is true)
   * @returns {Promise<Object>} Analyzed document
   */
  async analyzeDocument(document, isS3 = false, bucketName = null) {
    try {
      let params;
      
      if (isS3) {
        if (!bucketName) {
          throw new Error('Bucket name is required for S3 documents');
        }
        
        params = {
          Document: {
            S3Object: {
              Bucket: bucketName,
              Name: document
            }
          },
          FeatureTypes: ['FORMS', 'TABLES']
        };
      } else {
        params = {
          Document: {
            Bytes: Buffer.isBuffer(document) ? document : Buffer.from(document, 'base64')
          },
          FeatureTypes: ['FORMS', 'TABLES']
        };
      }
      
      const result = await this.textract.analyzeDocument(params).promise();
      return this._formatAnalyzeDocumentResponse(result);
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw new Error(`Failed to analyze document: ${error.message}`);
    }
  }

  /**
   * Start asynchronous document analysis job
   * @param {string} documentKey - S3 object key
   * @param {string} bucketName - S3 bucket name
   * @param {string} snsTopicArn - SNS topic ARN for job completion notification
   * @param {string} roleArn - IAM role ARN for Textract to access S3
   * @returns {Promise<Object>} Job details
   */
  async startDocumentAnalysis(documentKey, bucketName, snsTopicArn, roleArn) {
    try {
      const params = {
        DocumentLocation: {
          S3Object: {
            Bucket: bucketName,
            Name: documentKey
          }
        },
        FeatureTypes: ['FORMS', 'TABLES'],
        NotificationChannel: {
          SNSTopicArn: snsTopicArn,
          RoleArn: roleArn
        }
      };
      
      const result = await this.textract.startDocumentAnalysis(params).promise();
      return {
        jobId: result.JobId,
        status: 'IN_PROGRESS'
      };
    } catch (error) {
      console.error('Error starting document analysis:', error);
      throw new Error(`Failed to start document analysis: ${error.message}`);
    }
  }

  /**
   * Get document analysis job results
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Job results
   */
  async getDocumentAnalysis(jobId) {
    try {
      const results = [];
      let nextToken = null;
      
      do {
        const params = {
          JobId: jobId,
          MaxResults: 1000
        };
        
        if (nextToken) {
          params.NextToken = nextToken;
        }
        
        const response = await this.textract.getDocumentAnalysis(params).promise();
        results.push(response);
        nextToken = response.NextToken;
      } while (nextToken);
      
      return this._formatDocumentAnalysisResults(results);
    } catch (error) {
      console.error('Error getting document analysis results:', error);
      throw new Error(`Failed to get document analysis results: ${error.message}`);
    }
  }

  /**
   * Extract key information from insurance documents
   * @param {Object} documentAnalysis - Analyzed document
   * @returns {Object} Extracted insurance information
   */
  extractInsuranceInfo(documentAnalysis) {
    try {
      const formFields = documentAnalysis.forms || [];
      const extractedInfo = {
        policyNumber: this._findFieldValue(formFields, ['policy number', 'policy #', 'policy no']),
        policyHolder: this._findFieldValue(formFields, ['policy holder', 'insured name', 'insured']),
        insuranceCompany: this._findFieldValue(formFields, ['insurance company', 'insurer', 'carrier']),
        claimNumber: this._findFieldValue(formFields, ['claim number', 'claim #', 'claim no']),
        dateOfLoss: this._findFieldValue(formFields, ['date of loss', 'loss date']),
        coverageAmount: this._findFieldValue(formFields, ['coverage amount', 'coverage limit', 'policy limit']),
        deductible: this._findFieldValue(formFields, ['deductible']),
        propertyAddress: this._findFieldValue(formFields, ['property address', 'insured location', 'risk address'])
      };
      
      return extractedInfo;
    } catch (error) {
      console.error('Error extracting insurance information:', error);
      throw new Error(`Failed to extract insurance information: ${error.message}`);
    }
  }

  /**
   * Extract key information from roofing contracts
   * @param {Object} documentAnalysis - Analyzed document
   * @returns {Object} Extracted contract information
   */
  extractContractInfo(documentAnalysis) {
    try {
      const formFields = documentAnalysis.forms || [];
      const extractedInfo = {
        contractorName: this._findFieldValue(formFields, ['contractor name', 'company name']),
        customerName: this._findFieldValue(formFields, ['customer name', 'client name', 'homeowner']),
        projectAddress: this._findFieldValue(formFields, ['project address', 'property address', 'job site']),
        contractDate: this._findFieldValue(formFields, ['contract date', 'date', 'agreement date']),
        projectDescription: this._findFieldValue(formFields, ['project description', 'scope of work', 'description']),
        totalAmount: this._findFieldValue(formFields, ['total amount', 'contract amount', 'total price']),
        startDate: this._findFieldValue(formFields, ['start date', 'commencement date']),
        completionDate: this._findFieldValue(formFields, ['completion date', 'end date'])
      };
      
      return extractedInfo;
    } catch (error) {
      console.error('Error extracting contract information:', error);
      throw new Error(`Failed to extract contract information: ${error.message}`);
    }
  }

  /**
   * Format text detection response
   * @param {Object} result - Raw text detection result
   * @returns {Object} Formatted text detection result
   * @private
   */
  _formatTextDetectionResponse(result) {
    const blocks = result.Blocks || [];
    const lines = blocks.filter(block => block.BlockType === 'LINE').map(line => line.Text);
    const words = blocks.filter(block => block.BlockType === 'WORD').map(word => word.Text);
    
    return {
      lines,
      words,
      rawBlocks: blocks
    };
  }

  /**
   * Format analyze document response
   * @param {Object} result - Raw analyze document result
   * @returns {Object} Formatted analyze document result
   * @private
   */
  _formatAnalyzeDocumentResponse(result) {
    const blocks = result.Blocks || [];
    
    // Extract form fields (key-value pairs)
    const forms = [];
    const keyMap = {};
    
    blocks.forEach(block => {
      if (block.BlockType === 'KEY_VALUE_SET' && block.EntityTypes.includes('KEY')) {
        const keyId = block.Id;
        const keyText = this._getTextFromRelationships(blocks, block, 'CHILD');
        keyMap[keyId] = keyText;
      }
    });
    
    blocks.forEach(block => {
      if (block.BlockType === 'KEY_VALUE_SET' && block.EntityTypes.includes('VALUE')) {
        const valueRelationships = block.Relationships || [];
        const keyRelationship = valueRelationships.find(rel => rel.Type === 'VALUE');
        
        if (keyRelationship && keyRelationship.Ids && keyRelationship.Ids.length > 0) {
          const keyId = keyRelationship.Ids[0];
          const key = keyMap[keyId];
          const value = this._getTextFromRelationships(blocks, block, 'CHILD');
          
          if (key && value) {
            forms.push({ key, value });
          }
        }
      }
    });
    
    // Extract tables
    const tables = [];
    const tableBlocks = blocks.filter(block => block.BlockType === 'TABLE');
    
    tableBlocks.forEach(tableBlock => {
      const cells = [];
      const cellRelationships = tableBlock.Relationships || [];
      const cellIds = cellRelationships.find(rel => rel.Type === 'CHILD')?.Ids || [];
      
      cellIds.forEach(cellId => {
        const cellBlock = blocks.find(block => block.Id === cellId);
        if (cellBlock) {
          const cellText = this._getTextFromRelationships(blocks, cellBlock, 'CHILD');
          cells.push({
            text: cellText,
            rowIndex: cellBlock.RowIndex,
            columnIndex: cellBlock.ColumnIndex,
            rowSpan: cellBlock.RowSpan || 1,
            columnSpan: cellBlock.ColumnSpan || 1
          });
        }
      });
      
      // Organize cells into a structured table
      const rowCount = Math.max(...cells.map(cell => cell.rowIndex), 0);
      const columnCount = Math.max(...cells.map(cell => cell.columnIndex), 0);
      
      const tableData = Array(rowCount).fill().map(() => Array(columnCount).fill(''));
      
      cells.forEach(cell => {
        if (cell.rowIndex > 0 && cell.columnIndex > 0) {
          tableData[cell.rowIndex - 1][cell.columnIndex - 1] = cell.text;
        }
      });
      
      tables.push(tableData);
    });
    
    return {
      forms,
      tables,
      rawBlocks: blocks
    };
  }

  /**
   * Format document analysis results
   * @param {Array} results - Raw document analysis results
   * @returns {Object} Formatted document analysis results
   * @private
   */
  _formatDocumentAnalysisResults(results) {
    const allBlocks = results.flatMap(result => result.Blocks || []);
    return this._formatAnalyzeDocumentResponse({ Blocks: allBlocks });
  }

  /**
   * Get text from block relationships
   * @param {Array} blocks - All blocks
   * @param {Object} block - Current block
   * @param {string} relationshipType - Relationship type
   * @returns {string} Concatenated text
   * @private
   */
  _getTextFromRelationships(blocks, block, relationshipType) {
    const relationships = block.Relationships || [];
    const relationship = relationships.find(rel => rel.Type === relationshipType);
    
    if (!relationship || !relationship.Ids) {
      return '';
    }
    
    const childBlocks = relationship.Ids.map(id => blocks.find(b => b.Id === id)).filter(Boolean);
    
    return childBlocks
      .sort((a, b) => {
        // Sort by position (top to bottom, left to right)
        if (a.Geometry && b.Geometry && a.Geometry.BoundingBox && b.Geometry.BoundingBox) {
          const aBox = a.Geometry.BoundingBox;
          const bBox = b.Geometry.BoundingBox;
          
          if (Math.abs(aBox.Top - bBox.Top) > 0.01) {
            return aBox.Top - bBox.Top;
          }
          
          return aBox.Left - bBox.Left;
        }
        
        return 0;
      })
      .map(b => b.Text || '')
      .join(' ')
      .trim();
  }

  /**
   * Find field value by possible key names
   * @param {Array} formFields - Form fields
   * @param {Array} possibleKeys - Possible key names
   * @returns {string} Field value
   * @private
   */
  _findFieldValue(formFields, possibleKeys) {
    const field = formFields.find(field => 
      possibleKeys.some(key => 
        field.key.toLowerCase().includes(key.toLowerCase())
      )
    );
    
    return field ? field.value : '';
  }
}

module.exports = new TextractService();
