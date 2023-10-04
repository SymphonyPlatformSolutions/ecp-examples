import { useEffect, useState, useMemo } from 'react';
import Select from 'react-select';
import './PodPicker.scss';
import { getEcpParam } from '../../Utils/utils';

type OptionType = {
  value?: string
  label?: string
}

export const PodPicker = () => {
  const options : OptionType[] = useMemo(() => [
    { label: 'Corporate', value: 'corporate.symphony.com' },
    { label: 'Preview', value: 'preview.symphony.com' },
    { label: 'ST3', value: 'st3.symphony.com' },
  ], []);
  const [ origin, setOrigin ] = useState<OptionType | null | undefined>(options[0]);

  useEffect(() => {
    const ecpOrigin = getEcpParam('ecpOrigin');
    if (ecpOrigin) {
      setOrigin(options.find(({ value }) => ecpOrigin === value ));
    }
  }, [ options ]);

  const handleChange = (option : any) => {
    const searchParams = new URLSearchParams(new URL(window.location.href).search);
    searchParams.set('ecpOrigin', option.value);
    window.location.search = searchParams.toString();
  };

  return (
    <Select
      options={options}
      value={origin}
      onChange={handleChange}
      className="pod-picker"
      classNamePrefix="pod-picker"
    />
  );
}
