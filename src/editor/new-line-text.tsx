import React from 'react';
export type NewLineTextProps = {
    text: string
}

export const NewLineText: React.FC<NewLineTextProps> = (props) => {
    if(!props.text) {
        return <div/>;
    }

    const text = props.text;
    const newText = text.split('\n').map(str => <div>{str}</div>);
    return <div>{newText}</div>;
}
