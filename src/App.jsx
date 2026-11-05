
import React, { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Trash2,
  Database,
  ShieldCheck,
  Activity,
  BarChart3,
  Search,
  ArrowUpRight,
  FileCheck,
  Sparkles
} from "lucide-react";

import "./App.css";

const sampleCSV = `id,name,email,department,salary
1,Ali Khan,ali@gmail.com,Finance,85000
2,Sara Ahmed,sara@gmail.com,IT,92000
3,Omar Hassan,invalid-email,Sales,65000
4,Fatima Noor,fatima@gmail.com,Finance,78000
5,Ali Khan,ali@gmail.com,Finance,85000
6,Usman Raza,,IT,72000
7,Ayesha Malik,ayesha@gmail.com,HR,
8,Hamza Shah,hamza@gmail.com,Sales,68000
9,Zara Ali,zara@gmail.com,HR,95000
10,Bilal Ahmed,wrong-email,IT,81000`;

export default function App() {
  const [data, setData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);

  const fileInput = useRef(null);

  // Upload and parse CSV
  const processCSV = (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please upload a CSV file.");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data;
        const columns = result.meta.fields || [];

        if (!rows.length || !columns.length) {
          alert("Your CSV file is empty or invalid.");
          return;
        }

        setData({ rows, columns });
        setFileName(file.name);
        setActiveTab("overview");
        setSearch("");
      },
      error: () => alert("Could not read the CSV file.")
    });
  };

  // Load sample dataset
  const loadSample = () => {
    const parsed = Papa.parse(sampleCSV, {
      header: true,
      skipEmptyLines: true
    });

    setData({
      rows: parsed.data,
      columns: parsed.meta.fields
    });

    setFileName("sample_dataset.csv");
    setActiveTab("overview");
  };

  // Data audit engine
  const audit = useMemo(() => {
    if (!data) return null;

    const { rows, columns } = data;

    const missingByColumn = {};
    const invalidEmails = [];
    const duplicates = [];
    const seen = new Set();

    columns.forEach((col) => {
      missingByColumn[col] = rows.filter((row) =>
        row[col] == null || String(row[col]).trim() === ""
      ).length;
    });

    rows.forEach((row, index) => {
      const normalized = JSON.stringify(
        columns.map((col) => String(row[col] ?? "").trim())
      );

      if (seen.has(normalized)) {
        duplicates.push(index + 2);
      } else {
        seen.add(normalized);
      }

      columns.forEach((col) => {
        const value = String(row[col] ?? "").trim();

        if (
          /email/i.test(col) &&
          value !== "" &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ) {
          invalidEmails.push({
            row: index + 2,
            column: col,
            value
          });
        }
      });
    });

    const totalCells = rows.length * columns.length;

    const missing = Object.values(missingByColumn)
      .reduce((a, b) => a + b, 0);

    const duplicateCount = duplicates.length;
    const invalidCount = invalidEmails.length;

    const penalty = totalCells
      ? Math.min(
          100,
          (missing / totalCells) * 55 +
          (duplicateCount / rows.length) * 25 +
          (invalidCount / rows.length) * 20
        )
      : 100;

    const score = Math.round(100 - penalty);

    const columnStats = columns.map((col) => {
      const values = rows
        .map((row) => String(row[col] ?? "").trim())
        .filter(Boolean);

      const numeric = values.filter(
        (value) => !isNaN(Number(value))
      );

      return {
        name: col,
        filled: values.length,
        missing: missingByColumn[col],
        unique: new Set(values).size,
        type:
          values.length === 0
            ? "Empty"
            : numeric.length === values.length
            ? "Numeric"
            : "Text"
      };
    });

    return {
      score,
      missing,
      duplicateCount,
      invalidCount,
      duplicates,
      invalidEmails,
      columnStats,
      missingByColumn
    };
  }, [data]);

  // Export audit report
  const downloadReport = () => {
    if (!audit) return;

    const report = {
      product: "DataCheck",
      file: fileName,
      generatedAt: new Date().toISOString(),
      qualityScore: audit.score,
      totalRows: data.rows.length,
      totalColumns: data.columns.length,
      missingValues: audit.missing,
      duplicateRows: audit.duplicateCount,
      invalidEmails: audit.invalidCount,
      columnStatistics: audit.columnStats,
      duplicateRowNumbers: audit.duplicates,
      invalidEmailDetails: audit.invalidEmails
    };

    const blob = new Blob(
      [JSON.stringify(report, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "datacheck-audit-report.json";
    link.click();

    URL.revokeObjectURL(url);
  };

  // Search dataset
  const filteredRows = data
    ? data.rows.filter((row) =>
        Object.values(row).some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(search.toLowerCase())
        )
      )
    : [];

  // Reset application
  const clearData = () => {
    setData(null);
    setFileName("");
    setSearch("");
    setActiveTab("overview");
  };

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={24} />
          </div>

          <div>
            <h2>DataCheck</h2>
            <span>DATA QUALITY PLATFORM</span>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <button
          className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <BarChart3 size={18} />
          Overview
        </button>

        <button
          className={`nav-item ${activeTab === "data" ? "active" : ""}`}
          onClick={() => setActiveTab("data")}
        >
          <Database size={18} />
          Data Explorer
        </button>

        <button
          className={`nav-item ${activeTab === "issues" ? "active" : ""}`}
          onClick={() => setActiveTab("issues")}
        >
          <AlertTriangle size={18} />
          Data Issues
        </button>

        <div className="sidebar-bottom">

          <div className="free-card">
            <Sparkles size={19} />
            <h4>Free forever</h4>
            <p>
              Essential data quality tools, free for everyone.
            </p>
            <span>PREMIUM FEATURES COMING SOON</span>
          </div>

          <div className="user-profile">
            <div className="avatar">DC</div>
            <div>
              <strong>DataCheck User</strong>
              <small>Free workspace</small>
            </div>
          </div>

        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main">

        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> {activeTab}
          </div>

          <div className="top-right">
            <span className="status-dot"></span>
            <span>All systems operational</span>
            <div className="top-avatar">DC</div>
          </div>
        </header>

        <div className="content">

          {/* PAGE HEADER */}
          <section className="page-heading">

            <div>
              <div className="eyebrow">
                DATA QUALITY INTELLIGENCE
              </div>

              <h1>Data Audit Dashboard</h1>

              <p>
                Understand, validate and improve your dataset quality.
              </p>
            </div>

            {data && (
              <button
                className="primary-btn"
                onClick={downloadReport}
              >
                <Download size={17} />
                Export Report
              </button>
            )}

          </section>

          {/* UPLOAD SCREEN */}
          {!data ? (

            <section className="upload-section">

              <div
                className={`upload-box ${dragging ? "dragging" : ""}`}

                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}

                onDragLeave={() => setDragging(false)}

                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);

                  if (e.dataTransfer.files[0]) {
                    processCSV(e.dataTransfer.files[0]);
                  }
                }}
              >

                <div className="upload-icon">
                  <Upload size={30} />
                </div>

                <h2>Upload your dataset</h2>

                <p>
                  Drag and drop your CSV file here, or browse your computer.
                </p>

                <button
                  className="primary-btn"
                  onClick={() => fileInput.current?.click()}
                >
                  <Upload size={17} />
                  Choose CSV File
                </button>

                <input
                  ref={fileInput}
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      processCSV(e.target.files[0]);
                    }

                    e.target.value = "";
                  }}
                />

                <div className="upload-note">
                  <ShieldCheck size={15} />
                  Your data stays in your browser. No server upload.
                </div>

                <div className="file-types">
                  SUPPORTED FORMAT: CSV
                </div>

              </div>

              <div className="sample-card">

                <div className="sample-icon">
                  <FileSpreadsheet size={23} />
                </div>

                <div>
                  <h3>New to DataCheck?</h3>
                  <p>
                    Try our sample dataset to explore the audit features.
                  </p>
                </div>

                <button
                  className="secondary-btn"
                  onClick={loadSample}
                >
                  Load sample data
                  <ArrowUpRight size={16} />
                </button>

              </div>

              <div className="features-grid">

                <div>
                  <CheckCircle2 />
                  <strong>Missing values</strong>
                  <span>Find incomplete records</span>
                </div>

                <div>
                  <Activity />
                  <strong>Duplicate detection</strong>
                  <span>Identify repeated rows</span>
                </div>

                <div>
                  <ShieldCheck />
                  <strong>Email validation</strong>
                  <span>Find invalid email formats</span>
                </div>

              </div>

            </section>

          ) : (
            <>

              {/* FILE INFORMATION */}
              <div className="file-banner">

                <div className="file-info">
                  <div className="file-icon">
                    <FileSpreadsheet />
                  </div>

                  <div>
                    <strong>{fileName}</strong>
                    <small>
                      {data.rows.length} records · {data.columns.length} columns
                    </small>
                  </div>
                </div>

                <button
                  className="clear-btn"
                  onClick={clearData}
                >
                  <Trash2 size={16} />
                  Remove dataset
                </button>

              </div>

              {/* METRICS */}
              <section className="metrics">

                <div className="metric-card score-card">
                  <div className="metric-top">
                    <span>DATA QUALITY SCORE</span>
                    <ShieldCheck size={19} />
                  </div>

                  <div className="score-number">
                    {audit.score}<small>/100</small>
                  </div>

                  <div className="progress">
                    <div style={{ width: `${audit.score}%` }}></div>
                  </div>

                  <small className="metric-caption">
                    {audit.score >= 90
                      ? "Excellent data quality"
                      : audit.score >= 70
                      ? "Good, but needs improvement"
                      : "Data needs attention"}
                  </small>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span>TOTAL RECORDS</span>
                    <Database size={19} />
                  </div>
                  <div className="metric-number">
                    {data.rows.length.toLocaleString()}
                  </div>
                  <small className="metric-caption">Rows analyzed</small>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span>MISSING VALUES</span>
                    <AlertTriangle size={19} />
                  </div>
                  <div className="metric-number">{audit.missing}</div>
                  <small className="metric-caption">Empty cells detected</small>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span>DUPLICATE ROWS</span>
                    <FileCheck size={19} />
                  </div>
                  <div className="metric-number">
                    {audit.duplicateCount}
                  </div>
                  <small className="metric-caption">Repeated records</small>
                </div>

                <div className="metric-card">
                  <div className="metric-top">
                    <span>INVALID EMAILS</span>
                    <XCircle size={19} />
                  </div>
                  <div className="metric-number">
                    {audit.invalidCount}
                  </div>
                  <small className="metric-caption">
                    Invalid email formats
                  </small>
                </div>

              </section>

              {/* NAVIGATION TABS */}
              <div className="tabs">

                {["overview", "data", "issues"].map((tab) => (

                  <button
                    key={tab}
                    className={
                      activeTab === tab
                        ? "tab active-tab"
                        : "tab"
                    }
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === "overview"
                      ? "Overview"
                      : tab === "data"
                      ? "Data Explorer"
                      : "Data Issues"}
                  </button>

                ))}

              </div>

              {/* OVERVIEW */}
              {activeTab === "overview" && (

                <section className="results-grid">

                  <div className="panel">

                    <div className="panel-heading">
                      <div>
                        <h3>Column quality analysis</h3>
                        <p>Detailed breakdown of your dataset</p>
                      </div>
                      <BarChart3 size={20} />
                    </div>

                    <div className="table-wrap">

                      <table>
                        <thead>
                          <tr>
                            <th>Column</th>
                            <th>Type</th>
                            <th>Filled</th>
                            <th>Missing</th>
                            <th>Unique</th>
                          </tr>
                        </thead>

                        <tbody>
                          {audit.columnStats.map((col) => (

                            <tr key={col.name}>
                              <td><strong>{col.name}</strong></td>

                              <td>
                                <span className="type-tag">
                                  {col.type}
                                </span>
                              </td>

                              <td>{col.filled}</td>

                              <td>
                                <span className={
                                  col.missing
                                    ? "danger-text"
                                    : "good-text"
                                }>
                                  {col.missing}
                                </span>
                              </td>

                              <td>{col.unique}</td>
                            </tr>

                          ))}
                        </tbody>
                      </table>

                    </div>
                  </div>

                  <div className="panel">

                    <div className="panel-heading">
                      <div>
                        <h3>Audit summary</h3>
                        <p>Issues identified in your dataset</p>
                      </div>
                      <Activity size={20} />
                    </div>

                    <div className="issue-list">

                      <div>
                        <span className="issue-icon warning">
                          <AlertTriangle />
                        </span>
                        <div>
                          <strong>Missing values</strong>
                          <small>Incomplete cells</small>
                        </div>
                        <b>{audit.missing}</b>
                      </div>

                      <div>
                        <span className="issue-icon danger">
                          <FileCheck />
                        </span>
                        <div>
                          <strong>Duplicate rows</strong>
                          <small>Repeated records</small>
                        </div>
                        <b>{audit.duplicateCount}</b>
                      </div>

                      <div>
                        <span className="issue-icon danger">
                          <XCircle />
                        </span>
                        <div>
                          <strong>Invalid emails</strong>
                          <small>Format validation</small>
                        </div>
                        <b>{audit.invalidCount}</b>
                      </div>

                    </div>

                    <button
                      className="view-issues"
                      onClick={() => setActiveTab("issues")}
                    >
                      View all issues
                      <ArrowUpRight size={16} />
                    </button>

                  </div>

                </section>

              )}

              {/* DATA EXPLORER */}
              {activeTab === "data" && (

                <section className="panel">

                  <div className="panel-heading">
                    <div>
                      <h3>Data Explorer</h3>
                      <p>Inspect the uploaded records</p>
                    </div>

                    <div className="search-box">
                      <Search size={16} />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search records..."
                      />
                    </div>
                  </div>

                  <div className="table-wrap">

                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          {data.columns.map((column) => (
                            <th key={column}>{column}</th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {filteredRows.slice(0, 200).map((row, i) => (

                          <tr key={i}>
                            <td>{i + 1}</td>

                            {data.columns.map((column) => (
                              <td key={column}>
                                {row[column] || (
                                  <span className="missing-cell">
                                    Missing
                                  </span>
                                )}
                              </td>
                            ))}

                          </tr>

                        ))}
                      </tbody>
                    </table>

                  </div>

                  <p className="table-footer">
                    Showing {Math.min(filteredRows.length, 200)} of{" "}
                    {filteredRows.length} matching records.
                  </p>

                </section>

              )}

              {/* DATA ISSUES */}
              {activeTab === "issues" && (

                <section className="panel">

                  <div className="panel-heading">
                    <div>
                      <h3>Data quality issues</h3>
                      <p>
                        Review the problems detected in your dataset
                      </p>
                    </div>
                    <AlertTriangle size={20} />
                  </div>

                  <div className="issue-list detailed">

                    {audit.columnStats
                      .filter((column) => column.missing > 0)
                      .map((column) => (

                        <div key={column.name}>
                          <span className="issue-icon warning">
                            <AlertTriangle />
                          </span>

                          <div>
                            <strong>
                              Missing values in {column.name}
                            </strong>
                            <small>
                              {column.missing} empty cells detected
                            </small>
                          </div>

                          <b>{column.missing}</b>
                        </div>

                      ))}

                    {audit.duplicates.map((row) => (

                      <div key={`duplicate-${row}`}>
                        <span className="issue-icon danger">
                          <FileCheck />
                        </span>

                        <div>
                          <strong>Duplicate row detected</strong>
                          <small>CSV row number {row}</small>
                        </div>

                        <span className="severity">Duplicate</span>
                      </div>

                    ))}

                    {audit.invalidEmails.map((email, index) => (

                      <div key={`email-${index}`}>
                        <span className="issue-icon danger">
                          <XCircle />
                        </span>

                        <div>
                          <strong>Invalid email address</strong>
                          <small>
                            Row {email.row} · {email.column}: {email.value}
                          </small>
                        </div>

                        <span className="severity">Invalid</span>
                      </div>

                    ))}

                    {audit.missing +
                      audit.duplicateCount +
                      audit.invalidCount === 0 && (

                      <div className="empty-success">
                        <CheckCircle2 size={30} />
                        <strong>No issues detected!</strong>
                        <p>
                          Your dataset passed all available checks.
                        </p>
                      </div>

                    )}

                  </div>

                </section>

              )}

              {/* PRIVACY NOTICE */}
              <div className="privacy-note">
                <ShieldCheck size={17} />
                <span>
                  <strong>Privacy protected.</strong>{" "}
                  Your CSV data is processed locally in your browser
                  and is not sent to our servers.
                </span>
              </div>

            </>

          )}

          {/* FOOTER */}
          <footer>
            <span>
              © 2026 DataCheck. Free data quality tools for everyone.
            </span>

            <span>
              Built for better data
              <ShieldCheck size={14} />
            </span>
          </footer>

        </div>
      </main>
    </div>
  );
}



