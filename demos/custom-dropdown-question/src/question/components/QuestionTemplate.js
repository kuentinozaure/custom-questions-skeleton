import React from "react";
import {Dropdown} from "./Dropdown";

export const TemplateRenderer = ({template, question, onDropdownChange, responseValue}) => {
    const parts = template.split('{{dropdown}}');

    return (
        <div>
            {parts.map((htmlPart, index) => (
                <React.Fragment key={index}>
                    {htmlPart && (
                        <span dangerouslySetInnerHTML={{ __html: htmlPart }} />
                    )}
                    {index < parts.length - 1 && (
                        <Dropdown
                            value={responseValue[0]}
                            options={question.dropdown_configs?.[index]?.options ?? []}
                            placeholder={question.dropdown_configs?.[index]?.placeholder ?? ""}
                            onChange={(value) => onDropdownChange(index, value)}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
