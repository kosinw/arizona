import React, { useRef } from "react";
import "tailwindcss/tailwind.css";
import "./App.css";
import { ReactComponent as Logo } from "./vectors/logo.svg";
import { HiChevronDown } from "react-icons/hi";
import SplitPane, { Pane } from "react-split-pane";

import Editor from "@monaco-editor/react";

function PageHeader() {
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
          Choose example:
        </label>
        <label className="relative">
          <select className="appearance-none block bg-transparent pr-6 py-1 text-gray-400 cursor-pointer font-medium text-sm focus:outline-none focus:text-white transition-colors duration-200">
            <option value="1" className="text-initial">
              Fibonacci
            </option>
            <option selected value="2" className="text-initial">
              Mandelbrot Set
            </option>
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
}

function EditFileButton({ active, buttonName }: EditFileButtonProps) {
  return (
    <button
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

function SplitView() {
  const monacoRef = useRef(null);

  function handleEditorWillMount(monaco: any) {
    // here is the monaco instance
    // do something before editor is mounted
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

    monaco.editor.defineTheme("myTheme", {
      base: "vs-dark",
      inherit: true,
      rules: [{ background: "18181b" }],
      colors: {
        "editor.background": "#18181b",
      },
    });
  }

  function handleEditorDidMount(editor: null, monaco: any) {
    // here is another way to get monaco instance
    // you can also store it in `useRef` for further usage
    monacoRef.current = editor;
  }

  return (
    <SplitPane minSize="320px" defaultSize="896px" split="vertical">
      <Pane className="h-full">
        <div className="flex-auto flex">
          <div className="flex flex-auto items-center pl-5 pr-4 sm:pl-6 z-10 -mt-px">
            <div className="flex flex-auto min-w-0 space-x-5">
              <EditFileButton active buttonName="Arizona" />
              <EditFileButton buttonName="WebAssembly Text Format" />
              <EditFileButton buttonName="AST" />
              <EditFileButton buttonName="HTML" />
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
              defaultLanguage="javascript"
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
  return (
    <>
      <PageHeader />
      <main className="flex-auto relative border-t border-gray-800">
        <SplitView />
      </main>
    </>
  );
}

export default App;
