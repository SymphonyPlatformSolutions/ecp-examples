import classNames from 'classnames';

export function cn(...inputs: Array<string | undefined | null | false>) {
  return classNames(inputs);
}