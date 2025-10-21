import React, {useEffect, useRef, useState} from "react";

export const Dropdown = ({onChange, value, placeholder, options}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value);
    const dropdownRef = useRef(null); // Ref to detect clicks outside the dropdown

    // Effect to close the dropdown when clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleToggle = () => setIsOpen(!isOpen);

    const handleOptionClick = (option) => {
        setSelectedValue(option);
        onChange(option);
        setIsOpen(false);
    };

    const getOptionItemStyle = (option, index) => ({
        ...dropdownOptionItemStyle,
        backgroundColor: selectedValue === option ? '#e0e0e0' : '#fff', // Highlight selected option
        borderBottom: index === options.length - 1 ? 'none' : '1px solid #eee', // No border for the last item
        '&:hover': {
            backgroundColor: '#f0f0f0',
        },
    });

    return (
        <div style={dropdownContainerStyle} ref={dropdownRef}>
            <div style={dropdownTriggerStyle(selectedValue, placeholder)} onClick={handleToggle}>
                {selectedValue !== undefined ? selectedValue : placeholder}
            </div>

            {isOpen && (
                <ul style={dropdownOptionsStyle}>
                    {options.map((option, index) => (
                        <li
                            key={index} // Using index as key is acceptable if options array is static and items don't reorder
                            style={getOptionItemStyle(option, index)}
                            onClick={() => handleOptionClick(option)}
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

const dropdownContainerStyle = {
    position: 'relative',
    display: 'inline-block',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
    width: '220px', // Fixed width for the dropdown
    overflow: 'visible', // Ensure dropdown menu is not clipped
};

const dropdownTriggerStyle = (selectedValue, placeholder) => ({
    // backgroundColor: '#f9f9f9',
    border: '1px solid #ccc',
    padding: '10px 15px',
    cursor: 'pointer',
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    boxSizing: 'border-box', // Ensures padding is included in the width
    color: selectedValue ? '#333' : '#888',
    backgroundColor: placeholder ? 'pink' : "#f9f9f9"
})

const dropdownOptionsStyle = {
    position: 'absolute',
    bottom: 'calc(100% + 8px)', // Position 8px above the trigger
    left: '50%',
    transform: 'translate(-50%)',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    zIndex: '1000', // Ensure it appears on top of other content
    listStyle: 'none', // Remove default list styling
    padding: '0',
    margin: '0',
    maxHeight: '200px', // Max height for scrollable options
    overflowY: 'auto', // Enable vertical scrolling if options exceed maxHeight
    display: 'flex',
    flexDirection: 'row',
    gap: '4px'
};

const dropdownOptionItemStyle = {
    padding: '10px 15px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease', // Smooth transition for hover effect
};

