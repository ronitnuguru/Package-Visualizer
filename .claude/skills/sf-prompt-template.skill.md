# Salesforce Prompt Template Skill

Expert skill for creating, deploying, and optimizing Salesforce Prompt Templates for Agentforce and Einstein AI.

## Core Capabilities

- Generate PromptTemplate metadata files with proper structure
- Create template variants for different use cases
- Integrate templates with GenAiFunction and GenAiPlugin
- Deploy templates via sf CLI
- Score templates with 120-point rubric
- Optimize for token efficiency and response quality

## Metadata Structure

### Complete GenAiPromptTemplate Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<GenAiPromptTemplate xmlns="http://soap.sforce.com/2006/04/metadata">
    <!-- Core Identification -->
    <activeVersionIdentifier>hash_identifier_v1</activeVersionIdentifier>
    <description>Template description (max 255 chars)</description>
    <developerName>API_Name_No_Spaces</developerName>
    <masterLabel>Display Name</masterLabel>
    
    <!-- Template Versions -->
    <templateVersions>
        <content>Your prompt with {!$Input:variableName} placeholders</content>
        
        <!-- Input Definitions -->
        <inputs>
            <apiName>variableName</apiName>
            <definition>primitive://String</definition>
            <masterLabel>Variable Label</masterLabel>
            <referenceName>Input:variableName</referenceName>
            <required>true</required>
        </inputs>
        
        <!-- Model & Format Configuration -->
        <primaryModel>sfdc_ai__DefaultGPT5Mini</primaryModel>
        <status>Published</status>
        <versionIdentifier>unique_hash_v1</versionIdentifier>
    </templateVersions>
    
    <!-- Type & Visibility -->
    <type>einstein_gpt__flex</type>
    <visibility>Global</visibility>
</GenAiPromptTemplate>
```

### Field Reference

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| activeVersionIdentifier | Yes | String | Hash identifying active version (system-managed) |
| developerName | Yes | String | API name (no spaces, alphanumeric + underscore) |
| masterLabel | Yes | String | Display name in UI (max 80 chars) |
| description | No | String | Template purpose (max 255 chars) |
| visibility | No | Enum | Access scope: Global, Namespace, Private (default: Global) |
| type | Yes | Enum | Template type (see table below) |
| **templateVersions** | | | |
| content | Yes | String | Prompt text with placeholders |
| inputs | Yes | Complex | Variable definitions (must match placeholders) |
| inputs.apiName | Yes | String | Variable name (matches placeholder) |
| inputs.definition | Yes | String | Data type: primitive://String, primitive://Number, etc. |
| inputs.referenceName | Yes | String | Reference syntax: Input:variableName |
| inputs.required | No | Boolean | Whether input is required (default: false) |
| primaryModel | Yes | Enum | AI model: sfdc_ai__DefaultGPT41, sfdc_ai__DefaultGPT5Mini |
| status | Yes | Enum | Published or Draft |
| versionIdentifier | Yes | String | Version hash (system-managed) |

### Template Types

| Type | Use Case | Best For | Token Budget |
|------|----------|----------|--------------|
| einstein_gpt__flex | General-purpose AI tasks | Custom workflows, flexible prompts | 500-2000 |
| einstein_gpt__fieldCompletion | Auto-populate record fields | Filling forms, data entry | 200-500 |
| einstein_gpt__summarization | Content summarization | Case summaries, email threads | 300-800 |
| einstein_gpt__classification | Categorize data | Case routing, sentiment analysis | 100-300 |
| einstein_gpt__actionCompletion | Complete user-initiated actions | Button clicks, menu actions | 200-600 |
| einstein_gpt__qnaCompletion | Answer questions | Knowledge base, FAQ responses | 300-1000 |
| einstein_gpt__decision | Binary or multi-choice decisions | Approval routing, triage | 100-400 |
| einstein_gpt__routing | Intelligent routing | Lead assignment, case queues | 150-400 |

## Input Variables & Placeholder Syntax

### Standard Input Variables
- `{!$Input:variableName}` - **Preferred syntax** (colon separator)
- `{!$Input.variableName}` - Legacy syntax (still supported)
- `{!$Input:RelatedList.fieldName}` - Related list data access

**Example**:
```xml
<inputs>
    <apiName>Customer_Name</apiName>
    <definition>primitive://String</definition>
    <referenceName>Input:Customer_Name</referenceName>
    <required>true</required>
</inputs>
<!-- Reference in content -->
<content>Welcome {!$Input:Customer_Name}!</content>
```

### Record Context Variables
- `{!Record.Id}` - Current record ID
- `{!Record.fieldName}` - Direct field access
- `{!Record.Owner.Name}` - Relationship traversal (up to 5 levels)
- `{!Record.Account.Industry}` - Lookup field access

### User Context Variables
- `{!$User.Name}` - Current user's full name
- `{!$User.Email}` - Current user's email
- `{!$User.Username}` - Username (login)
- `{!$User.Profile}` - Profile name
- `{!$User.Role}` - Role name (if assigned)

### Global Variables
- `{!$Global.OrgId}` - Organization ID (18-char)
- `{!$Global.OrgName}` - Organization display name
- `{!$Global.ApiVersion}` - Current API version (e.g., "62.0")
- `{!$Global.CurrentDateTime}` - ISO 8601 timestamp
- `{!$Global.Locale}` - User's locale (e.g., "en_US")

### Function Invocation
- `{!$Apex.ClassName.methodName}` - Apex method result (pass as input)
- `{!$Flow.FlowName.outputVariable}` - Flow output variable

**Note**: Complex logic should execute in Apex/Flow and pass results as inputs rather than inline invocation.

## Best Practices

### Prompt Engineering
1. **Clear Instructions**: Start with explicit role and task definition
2. **Context First**: Provide necessary context before asking questions
3. **Output Format**: Specify exact output format (JSON, text, list)
4. **Constraints**: Define boundaries (length, tone, forbidden actions)
5. **Examples**: Include few-shot examples for complex tasks

### Template Structure
```
You are a [ROLE]. Your task is to [TASK].

Context:
- Customer: {!$Input.customerName}
- Issue: {!$Input.issueDescription}
- History: {!$Input.interactionHistory}

Instructions:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Output Format:
[Specify JSON schema or text structure]

Constraints:
- Keep response under 200 words
- Use professional tone
- Do not include sensitive information
```

### Token Optimization
- Remove unnecessary whitespace
- Use concise variable names
- Avoid redundant instructions
- Leverage system prompts when possible

### Model Selection

**Primary Models** (commonly used in templates):
```xml
<!-- Balanced performance (Salesforce-managed mix) -->
<primaryModel>sfdc_ai__DefaultGPT4Omni</primaryModel>

<!-- Fast & cost-effective -->
<primaryModel>DefaultGPT4OmniMini</primaryModel>

<!-- Advanced reasoning (Anthropic Claude) -->
<primaryModel>sfdc_ai__DefaultBedrockAnthropicClaude4Sonnet</primaryModel>
```

**Model Comparison**:

| Model | Provider | Speed | Use Case |
|-------|----------|-------|----------|
| DefaultGPT4OmniMini | OpenAI | Fast | Classification, summaries, simple tasks |
| sfdc_ai__DefaultGPT4Omni | OpenAI | Balanced | General-purpose, complex prompts |
| sfdc_ai__DefaultBedrockAnthropicClaude4Sonnet | Anthropic | Medium | Long context, nuanced reasoning |
| sfdc_ai__DefaultBedrockAnthropicClaude45Opus | Anthropic | Slower | Advanced analysis, code generation |
| sfdc_ai__DefaultBedrockAnthropicClaude45Haiku | Anthropic | Fastest | High-volume, simple responses |

**Complete model list**: [Salesforce Supported Models](https://developer.salesforce.com/docs/ai/agentforce/guide/supported-models.html)

### Model Parameters

Configure in Apex (additionalConfig):
```apex
promptInput.additionalConfig.maxTokens = 1000;        // Response length limit
promptInput.additionalConfig.temperature = 0.7;       // Creativity (0.0=deterministic, 1.0=creative)
promptInput.additionalConfig.applicationName = 'MyApp';
```

**Note**: Context window limited to 65,536 tokens with data masking enabled.

## CLI Commands & Deployment

### Deploy Prompt Template
```bash
sf project deploy start --source-dir force-app/main/default/genAiPromptTemplates
```

### Deploy with Dependencies
```bash
# Deploy templates + functions + plugins + Apex together
sf project deploy start \
  --source-dir force-app/main/default/genAiPromptTemplates \
  --source-dir force-app/main/default/genAiFunctions \
  --source-dir force-app/main/default/genAiPlugins \
  --source-dir force-app/main/default/classes \
  --test-level RunLocalTests
```

### Retrieve Prompt Template
```bash
sf project retrieve start --metadata GenAiPromptTemplate:TemplateName
```

### List Templates in Org
```bash
sf data query --query "SELECT Id, DeveloperName, MasterLabel, Visibility FROM GenAiPromptTemplate"
```

### Package.xml for Templates
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>ISV_Agent_Create_Orgs_Prompt</members>
        <members>*</members>
        <name>GenAiPromptTemplate</name>
    </types>
    <types>
        <members>Create_Orgs_via_ISV_Agent</members>
        <name>GenAiFunction</name>
    </types>
    <types>
        <members>Agentic_Create_Orgs</members>
        <name>GenAiPlugin</name>
    </types>
    <version>62.0</version>
</Package>
```

### API Version Compatibility

| API Version | Support Level | Notes |
|-------------|---------------|-------|
| 60.0 | Limited | Basic template support |
| 61.0 | Full | All template types supported |
| 62.0+ | Full | Enhanced features (responseFormat, primaryModel) |

### Rollback Strategies
**Deactivate template**: Set `<visibility>Private</visibility>` or remove from org  
**Revert version**: Change `<activeVersionIdentifier>` to previous hash

## Integration Patterns

### With GenAiFunction
```xml
<GenAiFunction>
    <promptTemplate>PromptTemplateAPIName</promptTemplate>
    <parameters>
        <name>variableName</name>
        <dataType>STRING</dataType>
        <required>true</required>
    </parameters>
</GenAiFunction>
```

### With GenAiPlugin (Agentforce)
```xml
<GenAiPlugin>
    <topics>
        <description>Topic description</description>
        <instructions>
            <masterLabel>Instructions</masterLabel>
            <promptTemplate>PromptTemplateAPIName</promptTemplate>
        </instructions>
    </topics>
</GenAiPlugin>
```

### With Flow
- Add "Generate Prompt Response" element
- Select Prompt Template
- Map flow variables to template inputs
- Store output in flow variable

## ConnectAPI Integration Patterns

### Core Method: generateMessagesForPromptTemplate

**Complete Apex Pattern**:
```apex
public with sharing class PromptTemplateService {
    public static String generateResponse(
        String templateName, 
        Map<String, Object> inputs
    ) {
        // 1. Create input configuration
        ConnectApi.EinsteinPromptTemplateGenerationsInput promptInput = 
            new ConnectApi.EinsteinPromptTemplateGenerationsInput();
        promptInput.isPreview = false;
        
        // 2. Build wrapped value map
        Map<String, ConnectApi.WrappedValue> valueMap = 
            new Map<String, ConnectApi.WrappedValue>();
        
        for (String key : inputs.keySet()) {
            ConnectApi.WrappedValue wrapped = new ConnectApi.WrappedValue();
            Object value = inputs.get(key);
            
            if (value instanceof String || value instanceof Integer || value instanceof Boolean) {
                wrapped.value = value;
            } else if (value instanceof Id) {
                wrapped.value = new Map<String, String>{'id' => (String) value};
            } else {
                wrapped.value = value;
            }
            
            valueMap.put('Input:' + key, wrapped);
        }
        promptInput.inputParams = valueMap;
        
        // 3. Configure additional settings
        promptInput.additionalConfig = new ConnectApi.EinsteinLlmAdditionalConfigInput();
        promptInput.additionalConfig.applicationName = 'MyApplication';
        promptInput.additionalConfig.maxTokens = 1000;
        promptInput.additionalConfig.temperature = 0.7;
        
        // 4. Execute template
        try {
            ConnectApi.EinsteinPromptTemplateGenerationsRepresentation result = 
                ConnectApi.EinsteinLLM.generateMessagesForPromptTemplate(
                    templateName, 
                    promptInput
                );
            return result.generations[0].text;
        } catch (ConnectApi.ConnectApiException e) {
            System.debug('Template execution failed: ' + e.getMessage());
            throw e;
        }
    }
}
```

**Usage**:
```apex
Map<String, Object> inputs = new Map<String, Object>{
    'Customer_Name' => 'Acme Corp',
    'Issue_Description' => 'Login errors on mobile app'
};
String summary = PromptTemplateService.generateResponse('Case_Summarization', inputs);
```

### Advanced Patterns

**Batch Execution**:
```apex
public static List<Map<String, Object>> batchGenerate(
    String templateName,
    List<Map<String, Object>> inputsList
) {
    List<Map<String, Object>> results = new List<Map<String, Object>>();
    for (Map<String, Object> inputs : inputsList) {
        try {
            String response = generateResponse(templateName, inputs);
            results.add(new Map<String, Object>{
                'success' => true,
                'response' => response
            });
        } catch (Exception e) {
            results.add(new Map<String, Object>{
                'success' => false,
                'error' => e.getMessage()
            });
        }
    }
    return results;
}
```

**Async Execution (Queueable)**:
```apex
public class AsyncPromptGeneration implements Queueable {
    private String templateName;
    private Map<String, Object> inputs;
    private Id callbackRecordId;
    
    public void execute(QueueableContext context) {
        String response = PromptTemplateService.generateResponse(templateName, inputs);
        SObject record = callbackRecordId.getSObjectType().newSObject(callbackRecordId);
        record.put('AI_Response__c', response);
        update record;
    }
}
```

### Error Handling

**Common Exceptions**:
- `TEMPLATE_NOT_FOUND` - Template doesn't exist or not deployed
- `INVALID_INPUT` - Input variable missing or wrong type
- `RATE_LIMIT_EXCEEDED` - API limit reached
- `INSUFFICIENT_ACCESS` - User lacks permissions
- `TIMEOUT_EXCEEDED` - Generation took >30 seconds

**Retry Pattern**:
```apex
public static String generateWithBackoff(String templateName, Map<String, Object> inputs) {
    Integer maxRetries = 3;
    Integer attempt = 0;
    
    while (attempt < maxRetries) {
        try {
            return generateResponse(templateName, inputs);
        } catch (ConnectApi.ConnectApiException e) {
            if (e.getMessage().contains('RATE_LIMIT') && attempt < maxRetries - 1) {
                attempt++;
                // Queue for later retry
            } else {
                throw e;
            }
        }
    }
    throw new LimitException('Max retries exceeded');
}
```

## Agentforce Integration Architecture

### Complete Flow
```
User Utterance → GenAiPlugin (Topic) → GenAiFunction → @InvocableMethod → 
Callable → ConnectAPI → PromptTemplate → AI Response
```

### GenAiFunction Metadata

**Example** (based on your codebase):
```xml
<GenAiFunction xmlns="http://soap.sforce.com/2006/04/metadata">
    <description>Display org types for ISVs</description>
    <invocationTarget>AgentCreateOrgs</invocationTarget>
    <invocationTargetType>apex</invocationTargetType>
    <isConfirmationRequired>false</isConfirmationRequired>
    <isIncludeInProgressIndicator>true</isIncludeInProgressIndicator>
    <masterLabel>Create Orgs via ISV Agent</masterLabel>
    <progressIndicatorMessage>Loading ISV Agent...</progressIndicatorMessage>
</GenAiFunction>
```

**Note**: Template linkage happens in Apex, not in GenAiFunction metadata.

### @InvocableMethod Pattern

```apex
@InvocableMethod(label='Create Orgs' category='ISV Agent')
global static List<Response> findOrgs(List<Request> req) {
    String templateName = 'ISV_Agent_Create_Orgs_Prompt';
    
    // Call Callable wrapper
    Callable callableInstance = (Callable) Type.forName('AgentGenAiPromptTemplateController').newInstance();
    Map<String, Object> payload = new Map<String, Object>{
        'recordId' => req[0].orgRequest,
        'objectInput' => 'Org_Request',
        'promptTemplateName' => templateName
    };
    
    String result = (String) callableInstance.call('singleFreeText', payload);
    List<OrgAgent> orgsList = (List<OrgAgent>) JSON.deserialize(result, List<OrgAgent>.class);
    return new List<Response>{new Response(orgsList)};
}

global class Request {
    @InvocableVariable(required=true)
    global String orgRequest;
}

global class Response {
    @InvocableVariable(required=true)
    global List<OrgAgent> orgs;
}
```

### GenAiPlugin Topic Configuration

```xml
<GenAiPlugin xmlns="http://soap.sforce.com/2006/04/metadata">
    <developerName>Agentic_Create_Orgs</developerName>
    <masterLabel>Agentic Create Orgs</masterLabel>
    <pluginType>Topic</pluginType>
    <scope>Help with showcasing and creating orgs for ISVs</scope>
    <canEscalate>false</canEscalate>
    
    <!-- Link to GenAiFunction -->
    <genAiFunctions>
        <functionName>Create_Orgs_via_ISV_Agent</functionName>
    </genAiFunctions>
    
    <!-- Utterances for routing -->
    <aiPluginUtterances>
        <utterance>What orgs can I create?</utterance>
    </aiPluginUtterances>
    
    <!-- Instructions -->
    <genAiPluginInstructions>
        <description>Run Create Orgs action when displaying org options</description>
    </genAiPluginInstructions>
</GenAiPlugin>
```

## Security & Governance

### Field-Level Security

```apex
public class SecureQueryService {
    public static List<Account> getAccountsWithFLS() {
        if (!Schema.sObjectType.Account.fields.Name.isAccessible()) {
            throw new SecurityException('Insufficient field access');
        }
        return [SELECT Id, Name FROM Account WITH SECURITY_ENFORCED LIMIT 10];
    }
}
```

### Input Sanitization

```apex
public class InputSanitizer {
    public static Map<String, Object> sanitize(Map<String, Object> rawInputs) {
        Map<String, Object> clean = new Map<String, Object>();
        for (String key : rawInputs.keySet()) {
            Object value = rawInputs.get(key);
            if (value instanceof String) {
                String strValue = ((String) value).stripHtmlTags();
                strValue = String.escapeSingleQuotes(strValue);
                if (strValue.length() > 5000) {
                    strValue = strValue.substring(0, 5000) + '...';
                }
                clean.put(key, strValue);
            } else {
                clean.put(key, value);
            }
        }
        return clean;
    }
}
```

### Permission Checks

```apex
public static void checkExecutionPermission() {
    if (!FeatureManagement.checkPermission('Execute_Prompt_Templates')) {
        throw new SecurityException('User lacks permission to execute templates');
    }
}
```

### Audit Logging

```apex
public class PromptAuditLogger {
    public static void logExecution(String templateName, Map<String, Object> inputs, String response) {
        Prompt_Execution_Log__c log = new Prompt_Execution_Log__c(
            Template_Name__c = templateName,
            User__c = UserInfo.getUserId(),
            Response_Length__c = response.length(),
            Token_Estimate__c = (Integer) Math.ceil(response.length() / 4.0),
            Timestamp__c = DateTime.now()
        );
        insert log;
    }
}
```

## 130-Point Scoring Rubric

### Structure & Syntax (20 points)
- Valid XML structure (5)
- Proper namespace declaration (5)
- Complete metadata fields (activeVersionIdentifier, developerName, visibility, inputs) (5)
- Version management (5)

### Prompt Quality (30 points)
- Clear role definition (8)
- Explicit task instructions (8)
- Well-defined output format (7)
- Appropriate constraints (7)

### Variable Design (20 points)
- Descriptive variable names (5)
- Proper placeholder syntax ({!$Input:variable}) (5)
- Complete input definitions in metadata (5)
- Type-appropriate usage (5)

### Integration (20 points) ← INCREASED
- GenAiFunction compatibility (5)
- GenAiPlugin integration (5)
- ConnectAPI best practices (5)
- Flow/Apex accessibility (5)

### Optimization (15 points)
- Token efficiency (5)
- Model selection appropriate for task (5)
- Performance considerations (5)

### Documentation (10 points)
- Description clarity (5)
- Usage examples (3)
- Variable documentation (2)

### Security (10 points) ← ENHANCED
- No hardcoded credentials (2)
- Input validation (3)
- Sensitive data handling (2)
- Permission checks (3)

### Error Handling (5 points) ← NEW
- Timeout handling (2)
- Input validation (2)
- Graceful error messages (1)

**Total: 130 points**

**Rating Scale**:
- 117-130: Excellent (90%+)
- 104-116: Good (80-89%)
- 91-103: Acceptable (70-79%)
- <91: Needs Improvement (<70%)

## Common Use Cases

### Case Summarization
```xml
<content>You are an AI assistant helping customer service agents summarize support cases.

Case Details:
- Subject: {!$Input.Subject}
- Description: {!$Input.Description}
- Status: {!$Input.Status}
- Priority: {!$Input.Priority}

Create a concise 3-sentence summary highlighting:
1. The main issue
2. Current status
3. Next steps

Summary:</content>
```

### Email Generation
```xml
<content>Generate a professional email based on these details:

Recipient: {!$Input.recipientName}
Context: {!$Input.context}
Key Points: {!$Input.keyPoints}
Tone: {!$Input.tone}

Write a clear, professional email that:
- Addresses the recipient by name
- Covers all key points
- Maintains the specified tone
- Includes appropriate greeting and closing
- Is under 200 words

Email:</content>
```

### Data Classification
```xml
<content>Classify the following customer feedback into one of these categories:
- Bug Report
- Feature Request
- Complaint
- Praise
- Question

Feedback: {!$Input.feedbackText}
Product: {!$Input.productName}

Analyze the feedback and respond with ONLY the category name. No explanation needed.

Category:</content>
```

## Workflow

### Creating a New Prompt Template
1. Identify the use case and AI task
2. Define input variables and data sources
3. Write the prompt following best practices
4. Create metadata file in proper directory
5. Test with sample inputs
6. Deploy to scratch org
7. Integrate with GenAiFunction/Plugin
8. Test end-to-end with Agentforce
9. Run scoring rubric
10. Optimize based on feedback

### Testing Strategy
```bash
# Test in scratch org
sf org create scratch --definition-file config/project-scratch-def.json --alias pt-test

# Deploy template
sf project deploy start --source-dir force-app/main/default/promptTemplates --target-org pt-test

# Test via Apex anonymous
System.debug(ConnectApi.EinsteinLLM.generateResponse('PromptTemplateAPIName', inputMap));
```

## File Naming Convention

**Format**: `TemplateName.promptTemplate-meta.xml`

**Location**: `force-app/main/default/promptTemplates/`

**Example**: `CaseSummarization.promptTemplate-meta.xml`

## Version Management

- Always start with version 1
- Increment version for major changes
- Keep previous versions as Draft
- Set `activeVersion` to current production version
- Document changes in version labels

## Advanced Features

### Multi-Version Templates
```xml
<templateVersions>
    <content>Version 1 content...</content>
    <label>Initial Release</label>
    <status>Draft</status>
    <versionNumber>1</versionNumber>
</templateVersions>
<templateVersions>
    <content>Version 2 content with improvements...</content>
    <label>Enhanced with examples</label>
    <status>Published</status>
    <versionNumber>2</versionNumber>
</templateVersions>
```

### Dynamic Context Loading
```xml
<content>Analyze this opportunity:

Opportunity Details:
Name: {!Record.Name}
Amount: {!Record.Amount}
Stage: {!Record.StageName}
Close Date: {!Record.CloseDate}

Recent Activities: {!$Input.recentActivities}
Competitor Info: {!$Apex.CompetitorAnalysis.getInsights}

Provide a risk assessment and recommended next steps.</content>
```

## Error Handling & Troubleshooting

### Common Errors & Solutions

#### 1. TEMPLATE_NOT_FOUND
**Symptom**: `ConnectApi.ConnectApiException: TEMPLATE_NOT_FOUND`  
**Solution**:
```bash
# Verify template exists
sf data query --query "SELECT Id, DeveloperName FROM GenAiPromptTemplate WHERE DeveloperName = 'TemplateName'"

# Deploy if missing
sf project deploy start --source-dir force-app/main/default/genAiPromptTemplates
```

#### 2. INVALID_INPUT_VARIABLE
**Symptom**: Missing or mismatched input variables  
**Solution**:
```apex
public static void validateInputs(Map<String, Object> providedInputs, Set<String> requiredInputNames) {
    for (String required : requiredInputNames) {
        if (!providedInputs.containsKey(required) || providedInputs.get(required) == null) {
            throw new IllegalArgumentException('Missing required input: ' + required);
        }
    }
}
```

#### 3. TYPE_MISMATCH
**Symptom**: Input type doesn't match expected type  
**Solution**: Use type-safe WrappedValue pattern:
```apex
public static ConnectApi.WrappedValue wrapValue(Object value) {
    ConnectApi.WrappedValue wrapped = new ConnectApi.WrappedValue();
    if (value instanceof Id) {
        wrapped.value = new Map<String, String>{'id' => (String) value};
    } else if (value instanceof String || value instanceof Integer) {
        wrapped.value = value;
    }
    return wrapped;
}
```

#### 4. TIMEOUT_EXCEEDED
**Symptom**: Template execution exceeds 30-second limit  
**Solution**: Use async execution (see Queueable pattern in ConnectAPI section)

#### 5. RATE_LIMIT_EXCEEDED
**Symptom**: Exceeded Einstein API limits  
**Solution**: Implement exponential backoff or queue for later processing

#### 6. INSUFFICIENT_ACCESS
**Symptom**: User lacks permissions  
**Solution**: Check permissions before execution:
```apex
if (!FeatureManagement.checkPermission('Execute_Prompt_Templates')) {
    throw new SecurityException('Insufficient permissions');
}
```

### Debugging Strategies
- Enable debug logging: `System.debug('Template: ' + templateName);`
- Test placeholder resolution without AI generation
- Validate input types before execution
- Log request/response for troubleshooting

## Output Format

When creating a template, provide:
1. Complete XML file content
2. File path and naming
3. Integration code (GenAiFunction or GenAiPlugin)
4. Test Apex code
5. Scoring breakdown
6. Optimization suggestions

## References

### Official Salesforce Documentation
- [GenAiPromptTemplate Metadata](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_genaiprompttemplate.htm)
- [ConnectApi.EinsteinLLM Class](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/connectapi_examples_resolve_prompt_template.htm)
- [Supported AI Models](https://developer.salesforce.com/docs/ai/agentforce/guide/supported-models.html)
- [Prompt Builder Guide](https://help.salesforce.com/s/articleView?id=sf.prompt_builder.htm)
- [Agentforce Developer Guide](https://developer.salesforce.com/docs/einstein/genai/guide/agentforce-overview.html)
- [GenAiFunction Metadata](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_genaifunction.htm)
- [GenAiPlugin Metadata](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_genaiplugin.htm)
- [Einstein Trust Layer](https://help.salesforce.com/s/articleView?id=sf.einstein_trust_layer.htm)

### Related Skills
- `sf-ai-agentscript` - Agent Script DSL development
- `sf-ai-agentforce` - Agentforce platform configuration
- `sf-apex` - Apex development (Callable/InvocableMethod patterns)
- `sf-metadata` - Metadata management and deployment
- `sf-deploy` - DevOps and deployment strategies
- `sf-testing` - Apex testing and test automation

### Skill Version
- **v2.0** (2026-04): Complete rewrite with ConnectAPI, Agentforce architecture, security patterns, official model documentation
- **v1.0** (initial): Basic template structure and CLI commands
