import React from 'react';
import { HashRouter, Link, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom';
export { Link, NavLink, Route, Routes, useLocation, useParams };
export const FileRouter = ({ children }: { children: React.ReactNode }) => <HashRouter>{children}</HashRouter>;
export const FileCard = ({ children, lang, dir }: { children: React.ReactNode; lang?: string; dir?: string }) => <div className="eg-card-root" lang={lang} dir={dir}>{children}</div>;
