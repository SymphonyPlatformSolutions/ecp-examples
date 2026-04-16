import { useEffect, useState, useMemo } from 'react';
import Select from 'react-select';
import './PodPicker.scss';
import { getEcpParam } from '../../Utils/utils';
import { ALLOWED_ORIGINS } from '../../Utils/originAllowlist';

type OptionType = {
  value?: string
  label?: string
}

const POD_LABELS: Record<string, string> = {
  'corporate.symphony.com': 'Corporate',
  'preview.symphony.com': 'Preview',
  'st3.dev.symphony.com': 'ST3',
  'develop2.symphony.com': 'Develop2',
};

export const PodPicker = () => {
  const options : OptionType[] = useMemo(() =>
    ALLOWED_ORIGINS.map(origin => ({
      label: POD_LABELS[origin] || origin,
      value: origin,
    })),
  []);
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
