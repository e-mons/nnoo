import * as ReactPDF from '@react-pdf/renderer';
import type { ComponentType } from 'react';

/**
 * React 19 JSX compatibility wrapper for @react-pdf/renderer.
 * Resolves TS2786 and TS2607 where React 19's JSX element class definitions
 * conflict with older class component definitions in @react-pdf/renderer v4.
 */
export const Document: ComponentType<any> = ReactPDF.Document as any;
export const Page: ComponentType<any> = ReactPDF.Page as any;
export const View: ComponentType<any> = ReactPDF.View as any;
export const Text: ComponentType<any> = ReactPDF.Text as any;
export const Image: ComponentType<any> = ReactPDF.Image as any;
export const Link: ComponentType<any> = ReactPDF.Link as any;
export const Note: ComponentType<any> = ReactPDF.Note as any;
export const Canvas: ComponentType<any> = ReactPDF.Canvas as any;
export const StyleSheet = ReactPDF.StyleSheet;
export const Font = ReactPDF.Font;
export const renderToStream = ReactPDF.renderToStream;
export const pdf = ReactPDF.pdf;
