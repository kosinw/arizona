import React, { useRef } from "react";
import "tailwindcss/tailwind.css";
import "./App.css";
import { ReactComponent as Logo } from "./vectors/logo.svg";
import { HiChevronDown } from "react-icons/hi";
import SplitPane, { Pane } from "react-split-pane";

import Editor from "@monaco-editor/react";
import { useState } from "react";
import { MouseEventHandler } from "react";

enum SelectedExample {
  Mandelbrot = "Mandelbrot Set",
  Fibonacci = "Fibonacci",
  DOOM = "DOOM Fire",
}

interface PageHeaderProps {
  selectedExample: SelectedExample;
  updateSelectedExample: (x: SelectedExample) => void;
}

function PageHeader({
  selectedExample,
  updateSelectedExample,
}: PageHeaderProps) {
  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    updateSelectedExample(
      Object.values(SelectedExample)[parseInt(e.target.value)]
    );
  }

  return (
    <header className="relative z-10 flex-none py-3 pl-5 pr-3 sm:pl-6 sm:pr-4 md:pr-3.5 lg:px-6 flex items-center space-x-4">
      <div className="flex-auto flex items-center min-w-0 space-x-5">
        <div className="hidden sm:flex items-center space-x-5 min-w-0">
          <Logo />
          <div className="space-x-1">
            <span className="font-extrabold text-2xl">arizona</span>
            <span className="font-semibold text-primary-500 uppercase text-md tracking-tighter">
              play
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3 lg:space-x-3">
        <label className="appearance-none block bg-transparent py-1 text-primary-500 font-medium text-sm focus:outline-none focus:text-white">
          Change example:
        </label>
        <label className="relative">
          <select
            defaultValue="0"
            onChange={handleSelect}
            className="appearance-none block bg-transparent pr-6 py-1 text-gray-400 cursor-pointer font-medium text-sm focus:outline-none focus:text-white transition-colors duration-200"
          >
            {Object.values(SelectedExample).map((example, idx) => (
              <option key={example} value={`${idx}`} className="text-initial">
                {example}
              </option>
            ))}
          </select>
          <HiChevronDown
            className="w-5 h-5 text-gray-500 absolute top-1/2 right-0 -mt-2.5 pointer-events-none"
            fill="currentColor"
          />
        </label>
      </div>
    </header>
  );
}

interface EditFileButtonProps {
  active?: boolean;
  buttonName: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

function EditFileButton({ active, buttonName, onClick }: EditFileButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex text-xs leading-4 font-medium px-0.5 border-t-2 focus:outline-none transition-colors duration-150 ${
        active
          ? "border-primary-500"
          : "border-transparent text-gray-400 hover:text-white"
      } text-white`}
    >
      <span className="border-b-2 border-transparent py-2.5">{buttonName}</span>
    </button>
  );
}

function CompileButton() {
  return (
    <button className="flex text-xs leading-4 border-t-2 border-transparent text-gray-400 hover:text-white font-medium px-0.5 focus:outline-none">
      <span className="border-b-2 border-transparent py-2.5">Compile</span>
    </button>
  );
}

enum CurrentSelectedFile {
  Arizona = "arizona",
  HTML = "html",
  WebAssemblyTextFormat = "wat",
  AbstractSyntaxTree = "ast",
}

function SplitView() {
  const monacoRef = useRef(null);
  const [lang, setLang] = useState<CurrentSelectedFile>(
    CurrentSelectedFile.Arizona
  );

  function handleEditorWillMount(monaco: any) {
    monaco.editor.defineTheme("myTheme", {
      base: "vs-dark",
      inherit: true,
      rules: [{ background: "18181b" }],
      colors: {
        "editor.background": "#18181b",
      },
    });
  }

  function handleEditorDidMount(editor: null, _monaco: any) {
    monacoRef.current = editor;
  }

  return (
    <SplitPane minSize="320px" defaultSize="50%" split="vertical">
      <Pane className="h-full">
        <div className="flex-auto flex">
          <div className="flex flex-auto items-center pl-5 pr-4 sm:pl-6 z-10 -mt-px">
            <div className="flex flex-auto min-w-0 space-x-5">
              <EditFileButton
                onClick={() => setLang(CurrentSelectedFile.Arizona)}
                active={lang === CurrentSelectedFile.Arizona}
                buttonName="Arizona"
              />
              <EditFileButton
                onClick={() => setLang(CurrentSelectedFile.HTML)}
                active={lang === CurrentSelectedFile.HTML}
                buttonName="HTML"
              />
              <EditFileButton
                onClick={() =>
                  setLang(CurrentSelectedFile.WebAssemblyTextFormat)
                }
                active={lang === CurrentSelectedFile.WebAssemblyTextFormat}
                buttonName="WebAssembly Text Format"
              />
              <EditFileButton
                onClick={() => setLang(CurrentSelectedFile.AbstractSyntaxTree)}
                active={lang === CurrentSelectedFile.AbstractSyntaxTree}
                buttonName="AST"
              />
            </div>
          </div>
          <div className="flex items-center pr-5">
            <CompileButton />
          </div>
        </div>
        <div className="border-t h-full border-gray-800 flex-auto flex pt-2">
          <div className="w-full h-full">
            <Editor
              theme="myTheme"
              height="100%"
              path="module.az"
              options={{
                minimap: {
                  enabled: false,
                },
              }}
              defaultLanguage="rust"
              beforeMount={handleEditorWillMount}
              onMount={handleEditorDidMount}
            />
          </div>
        </div>
      </Pane>
      <Pane className=""></Pane>
    </SplitPane>
  );
}

function App() {
  const [selectedExample, changeSelectedExample] = useState<SelectedExample>(
    SelectedExample.Mandelbrot
  );

  return (
    <>
      <PageHeader
        updateSelectedExample={(opt) => changeSelectedExample(opt)}
        selectedExample={selectedExample}
      />
      <main className="flex-auto relative border-t border-gray-800">
        <SplitView />
      </main>
    </>
  );
}

export default App;
