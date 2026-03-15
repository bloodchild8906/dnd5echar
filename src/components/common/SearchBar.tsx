interface SearchBarProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export const SearchBar = ({ value, placeholder = 'Search', onChange }: SearchBarProps) => {
  return (
    <input
      className="input search-bar"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
};
