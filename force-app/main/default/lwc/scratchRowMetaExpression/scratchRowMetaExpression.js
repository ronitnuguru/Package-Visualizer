import { LightningElement, api } from 'lwc';
import {
    OPERATOR_OPTIONS,
    BOOLEAN_OPTIONS,
    DEFAULT_FIELDS,
    castFieldValue
} from 'c/scratchOrgConfig';

const EMPTY_FIELD = {
    fieldName: '',
    fieldOperator: 'boolean',
    fieldValue: ''
};

const decorate = (row, index) => ({
    autoNumber: index,
    fieldName: row.fieldName ?? '',
    fieldOperator: row.fieldOperator ?? 'boolean',
    fieldValue: row.fieldValue ?? '',
    displayBoolean: (row.fieldOperator ?? 'boolean') === 'boolean',
    displayString: row.fieldOperator === 'string',
    displayInteger: row.fieldOperator === 'integer'
});

export default class ScratchRowMetaExpression extends LightningElement {
    @api confirmSelected;
    @api rowIndex;
    @api settingValue;

    fieldSettings = [];

    operatorOptions = OPERATOR_OPTIONS;
    booleanOptions = BOOLEAN_OPTIONS;

    connectedCallback() {
        const seed = DEFAULT_FIELDS[this.settingValue] ?? [{ ...EMPTY_FIELD }];
        this.fieldSettings = seed.map((row, index) => decorate(row, index));
    }

    /**
     * Returns the row data for this setting as `{ [settingName]: { field: typedValue, ... } }`.
     * Boolean and integer values are cast to their real runtime types (not strings).
     */
    @api
    getMetaRows() {
        const rows = this.fieldSettings.reduce((acc, row) => {
            if (!row.fieldName) return acc;
            return { ...acc, [row.fieldName]: castFieldValue(row.fieldOperator, row.fieldValue) };
        }, {});
        return { [this.settingValue]: rows };
    }

    handleAddMetaSetting() {
        const nextIndex = this.fieldSettings.length;
        this.fieldSettings = [...this.fieldSettings, decorate({ ...EMPTY_FIELD }, nextIndex)];
    }

    handleDeleteMetaSetting(event) {
        const index = Number(event.target.dataset.index);
        this.fieldSettings = this.fieldSettings
            .filter((_, i) => i !== index)
            .map((row, i) => decorate(row, i));
    }

    handleMetadataValueChange(event) {
        const index = Number(event.target.dataset.index);
        this.fieldSettings = this.fieldSettings.map((row, i) =>
            i === index ? decorate({ ...row, fieldValue: event.target.value }, i) : row
        );
    }

    handleMetadataFieldChange(event) {
        const index = Number(event.target.dataset.index);
        this.fieldSettings = this.fieldSettings.map((row, i) =>
            i === index ? decorate({ ...row, fieldName: event.target.value }, i) : row
        );
    }

    handleOperatorChange(event) {
        const index = Number(event.target.dataset.index);
        const operator = event.target.value;
        // Reset value when operator switches to avoid carrying stale strings (e.g. "true") into a number field.
        this.fieldSettings = this.fieldSettings.map((row, i) =>
            i === index ? decorate({ ...row, fieldOperator: operator, fieldValue: '' }, i) : row
        );
    }
}
