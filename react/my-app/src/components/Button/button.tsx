import React, { ButtonHTMLAttributes, AnchorHTMLAttributes, FC } from 'react';
import classNames from 'classnames';

export enum ButtonSize {
	large = 'lg',
	Small = 'sm',
}

export enum ButtonType {
	Primary = 'primary',
	Default = 'default',
	Danger = 'danger',
	Link = 'link',
}

interface BaseButtonProps {
	className?: string;
	disabled?: boolean;
	size?: ButtonSize;
	btnType?: ButtonType;
	href?: string;
	children: React.ReactNode;
}

type NativeButtonProps = BaseButtonProps & ButtonHTMLAttributes<HTMLElement>;
type AnchorButtonProps = BaseButtonProps & AnchorHTMLAttributes<HTMLElement>;

export type ButtonProps = Partial<NativeButtonProps & AnchorButtonProps>;
const Button: FC<ButtonProps> = (props) => {
	const {
		className,
		disabled,
		size,
		btnType,
		href,
		children,
		...restProps
	} = props;
	const classes = classNames('btn', className, {
		[`btn-${btnType}`]: btnType,
		[`btn-${size}`]: size,
		disabled: btnType === ButtonType.Link && disabled,
	});

	if (btnType === ButtonType.Link && href) {
		return (
			<a {...restProps} className={classes} href={href}>
				{children}
			</a>
		);
	} else {
		return (
			<button {...restProps} className={classes} disabled={disabled}>
				{children}
			</button>
		);
	}
};

Button.defaultProps = {
	disabled: false,
	btnType: ButtonType.Default,
};
export default Button;
