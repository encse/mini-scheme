import React from 'react';

export type SampleProps = {
    samples: string[],
    onSampleSelected: (index: number) => void;
}

export const Samples: React.FC<SampleProps> = (props: SampleProps) => {

    const options = props.samples.map(sample => {
        let text = sample.split('\n')[0].trim().replace(/^; /, '');
        return <option key={sample}>{text}</option>
    });

    const onChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
        props.onSampleSelected(event.target.selectedIndex);
    };
    return <select
        className="sicp-editor-select-sample"
        onChange={onChange}>
        {options}
    </select>
}
