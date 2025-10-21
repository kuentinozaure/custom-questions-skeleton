import React, {useState} from "react";
import {Dropdown} from "./Dropdown";

export const TemplateRenderer = ({template, question, onDropdownChange, responseValue}) => {
    const parts = template.split('{{dropdown}}');
    const [currentResponse, setCurrentResponse] = useState(responseValue);

    return (
        <div>
            {parts.map((htmlPart, index) => (
                <React.Fragment key={index}>
                    {htmlPart && (
                        <span dangerouslySetInnerHTML={{ __html: htmlPart }} />
                    )}
                    {index < parts.length - 1 && (
                        <Dropdown
                            value={currentResponse[index]}
                            options={question.dropdown_configs?.[index]?.options ?? []}
                            placeholder={question.dropdown_configs?.[index]?.placeholder ?? ""}
                            onChange={(value) => {
                                const updatedResponse = {...currentResponse, [index]: value}
                                setCurrentResponse(updatedResponse);
                                onDropdownChange(updatedResponse)
                            }}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
